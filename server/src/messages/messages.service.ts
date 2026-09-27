import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, MessageType } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';

type UploadFile = { buffer: Buffer; originalname: string };
type MessageFiles = {
  images?: UploadFile[];
  videos?: UploadFile[];
  audios?: UploadFile[];
  files?: UploadFile[];
};

@Injectable()
export class MessagesService {
  private readonly allowedReactions = ['👍', '❤️', '🔥', '👏', '😢', '😍', '👎', '🎉', '💩', '💯'];

  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.message.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async sendMessage(userName: string, files: MessageFiles, body: Record<string, any>) {
    const group = await this.authorizedGroup(userName, body.group);
    const media = await this.uploadMedia(files);
    const data = await this.prisma.message.create({
      data: {
        user: userName,
        group: group.url,
        topic: body.topic || null,
        message: body.message || null,
        reply: body.reply || null,
        type: (body.type || 'message') as MessageType,
        images: media.images,
        video: media.video,
        audio: media.audio,
        file: media.file,
      },
    });
    return { success: true, message: 'Xabar muvaffaqiyatli yuborildi', data };
  }

  async updateMessage(userName: string, id: string, files: MessageFiles, body: Record<string, any>) {
    const existing = await this.ownedMessage(userName, id);
    const media = await this.uploadMedia(files);
    const images = [...this.array(body.existingImages), ...media.images];
    const data = await this.prisma.message.update({
      where: { id },
      data: {
        message: body.message ?? null,
        images,
        video: body.existingVideo !== undefined ? body.existingVideo : media.video || existing.video,
        audio: body.existingAudio !== undefined ? body.existingAudio : media.audio || existing.audio,
        file: body.existingFile !== undefined ? body.existingFile : media.file || existing.file,
      },
    });
    return { success: true, message: 'Xabar tahrirlandi', data };
  }

  async toggleReaction(userName: string, id: string, emoji: string) {
    if (!this.allowedReactions.includes(emoji?.trim())) throw new BadRequestException('Reaksiya qo\'llab-quvvatlanmaydi.');
    const message = await this.prisma.message.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Xabar topilmadi');
    const reactions = this.array(message.reactions) as Array<{ emoji: string; users: string[] }>;
    const current = reactions.find((item) => item.emoji === emoji.trim());
    if (current?.users.includes(userName)) current.users = current.users.filter((user) => user !== userName);
    else if (current) current.users.push(userName);
    else reactions.push({ emoji: emoji.trim(), users: [userName] });
    const data = await this.prisma.message.update({ where: { id }, data: { reactions } });
    return { success: true, message: 'Reaksiya yangilandi', data };
  }

  async deleteMessage(userName: string, id: string) {
    await this.ownedMessage(userName, id);
    await this.prisma.message.delete({ where: { id } });
    return { success: true, message: 'Xabar o\'chirildi' };
  }

  async messageData(userName: string, groupName: string, topicName?: string) {
    await this.authorizedGroup(userName, groupName);
    const messages = await this.prisma.message.findMany({
      where: { group: groupName, ...(topicName && !['undefined', 'null'].includes(topicName) ? { topic: topicName } : { topic: null }) },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((message) => ({ ...message, isMe: message.user === userName }));
  }

  private async authorizedGroup(userName: string, url: string) {
    if (!url) throw new BadRequestException('Guruh (group) ko\'rsatilishi shart!');
    const group = await this.prisma.group.findUnique({ where: { url } });
    if (!group) throw new NotFoundException('Guruh topilmadi');
    const members = this.array(group.users) as Array<{ userName?: string }>;
    if (group.founder !== userName && !members.some((member) => member.userName === userName)) {
      throw new ForbiddenException('Siz bu guruh a\'zosi emassiz');
    }
    return group;
  }

  private async ownedMessage(userName: string, id: string) {
    const message = await this.prisma.message.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Xabar topilmadi');
    if (message.user !== userName) throw new ForbiddenException('Siz bu xabarga ruxsatga ega emassiz');
    return message;
  }

  private array(value: Prisma.JsonValue | unknown): any[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  }

  private upload(file: UploadFile, resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type: resourceType, folder: 'shop_app/messages' }, (error, result) => error ? reject(error) : resolve(result?.secure_url || ''));
      stream.end(file.buffer);
    });
  }

  private async uploadMedia(files: MessageFiles = {}) {
    const images = await Promise.all((files.images ?? []).map((file) => this.upload(file, 'image')));
    const video = files.videos?.[0] ? await this.upload(files.videos[0], 'video') : null;
    const audio = files.audios?.[0] ? await this.upload(files.audios[0]) : null;
    const file = files.files?.[0] ? await this.upload(files.files[0], 'raw') : null;
    return { images, video, audio, file };
  }
}
