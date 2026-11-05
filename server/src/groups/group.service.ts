import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';
import { GroupRepository } from './group.repository';

type JsonRecord = Record<string, any>;

@Injectable()
export class GroupService {
  constructor(
    private readonly groups: GroupRepository,
    private readonly prisma: PrismaService,
  ) {}

  private json(value: unknown, fallback: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return fallback;
      }
    }
    return value ?? fallback;
  }

  private users(group: any): JsonRecord[] {
    const value = this.json(group.users, []);
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  private topics(group: any): JsonRecord[] {
    const value = this.json(group.topics, []);
    return Array.isArray(value) ? value : [];
  }

  private async findGroup(url: string): Promise<any> {
    const group = await this.groups.findByUrl(url);
    if (!group) throw new NotFoundException('Guruh topilmadi!');
    return group;
  }

  private async updateGroupJson(url: string, data: JsonRecord): Promise<void> {
    await this.prisma.group.update({ where: { url }, data: data as any });
  }

  private member(group: any, userName: string): JsonRecord | undefined {
    return this.users(group).find((user) => user.userName === userName);
  }

  private isMember(group: any, userName: string): boolean {
    return group.founder === userName || !!this.member(group, userName);
  }

  private async verifyOwner(userName: string, url: string): Promise<any> {
    const group = await this.findGroup(url);
    if (group.founder !== userName) {
      throw new ForbiddenException(
        "Sizda bu amalni bajarish uchun huquq yo'q (owner bo'lishingiz kerak)",
      );
    }
    return group;
  }

  async findAll() {
    return this.groups.findAll();
  }

  async findGroups(userName: string) {
    const groups = await this.groups.findAll();
    return groups.filter((group: any) => this.isMember(group, userName));
  }

  private async mediaSummary(group: string, topic?: string) {
    const messages = await this.prisma.message.findMany({
      where: {},
      select: {
        message: true,
        images: true,
        video: true,
        audio: true,
        file: true,
        group: true,
        topic: true,
        groups: true,
      },
    });
    const links = new Set<string>();
    const images: any[] = [];
    const videos: any[] = [];
    const audios: any[] = [];
    const files: any[] = [];
    for (const item of messages.filter((item) => {
      if (item.group === group && (!topic || item.topic === topic)) return true;
      const references = this.json(item.groups, []);
      return (
        Array.isArray(references) &&
        references.some(
          (reference) =>
            reference?.group === group && (!topic || reference.topic === topic),
        )
      );
    })) {
      for (const link of item.message?.match(/https?:\/\/[^\s]+/g) ?? [])
        links.add(link);
      const itemImages = this.json(item.images, []);
      if (Array.isArray(itemImages)) images.push(...itemImages);
      if (item.video) videos.push(item.video);
      if (item.audio) audios.push(item.audio);
      if (item.file) files.push(item.file);
    }
    return { links: [...links], images, videos, audios, files };
  }

  async findGroupData(userName: string, url: string) {
    const group = await this.findGroup(url);
    if (!this.isMember(group, userName))
      throw new ForbiddenException('siz bu guruhga taluqli emassiz!');
    const allUsers = await this.prisma.user.findMany();
    const users = this.users(group).flatMap((entry) => {
      const user = allUsers.find(
        (candidate) => candidate.userName === entry.userName,
      );
      if (!user) return [];
      return [
        {
          ...user,
          tag: entry.permissions?.tag || '',
          setTag: entry.permissions?.setTag || [],
          role: entry.permissions?.role || 'member',
          isMe: user.userName === userName,
        },
      ];
    });
    const founder = allUsers.find(
      (candidate) => candidate.userName === group.founder,
    );
    if (founder && !users.some((user) => user.userName === group.founder))
      users.unshift({
        ...founder,
        role: 'owner',
        tag: 'owner',
        setTag: [],
        isMe: founder.userName === userName,
      });
    return {
      logo: group.logo || null,
      description: group.description || '',
      url: group.url,
      title: group.title,
      securityLevel: group.securityLevel || 'public',
      limit: group.limit || null,
      members: users,
      memberCount: users.length,
      ...(await this.mediaSummary(url)),
    };
  }

  async findTopicData(userName: string, groupUrl: string, topicUrl: string) {
    const group = await this.findGroup(groupUrl);
    if (!this.isMember(group, userName))
      throw new ForbiddenException('siz bu guruhga taluqli emassiz!');
    const topic = this.topics(group).find(
      (item) =>
        item.url === topicUrl || item.id === topicUrl || item.name === topicUrl,
    );
    if (!topic) throw new NotFoundException('Topic topilmadi!');
    return {
      title: topic.title || topic.name,
      url: `${group.url}/${topic.url || topic.id}`,
      logo: topic.image || topic.logo || null,
      ...(await this.mediaSummary(groupUrl, topicUrl)),
    };
  }

  async findContacts(userName: string) {
    const user = await this.prisma.user.findFirst({ where: { userName } });
    if (!user) throw new NotFoundException('Bunday foydalanuvchi topilmadi!');
    const groups = (await this.groups.findAll()).filter(
      (group: any) => group.type === 'chat' && this.isMember(group, userName),
    );
    const names = new Set<string>();
    for (const group of groups) {
      const members = this.users(group);
      if (group.founder === userName)
        members.forEach(
          (member) =>
            member.userName &&
            member.userName !== userName &&
            names.add(member.userName),
        );
      else if (group.founder) names.add(group.founder);
    }
    return this.prisma.user.findMany({
      where: { userName: { in: [...names] } },
    });
  }

  private permissions(type: 'group' | 'chat' = 'group') {
    return {
      role: type === 'chat' ? 'admin' : 'member',
      tag: '',
      updateGroup: false,
      setTag: type === 'chat' ? ['self'] : ['admin'],
      poll: true,
      addMembers: type !== 'chat',
      deleteMembers: false,
      topic: type !== 'chat',
      crud: {
        create: {
          message: true,
          image: true,
          video: true,
          audio: true,
          poll: true,
        },
        delete: {
          message: true,
          image: true,
          video: true,
          audio: true,
          poll: true,
        },
      },
      pin: { message: true, image: true, video: true, audio: true, poll: true },
    };
  }

  async createGroup(userName: string, body: any) {
    if (!body.title) throw new BadRequestException('title kiritilishi shart!');
    let logo = '';
    if (body.logo?.buffer) logo = (await uploadImageToImgBB(body.logo)) || '';
    const group = await this.groups.create({
      title: body.title,
      ...(body.url && { url: body.url }),
      securityLevel: body.securityLevel || 'private',
      logo,
      founder: userName,
      type: 'group',
      limit: body.limit || '/infty',
      users: [],
      topics: [],
      defaults: this.permissions(),
      description: body.description || '',
    } as any);
    return { message: 'guruh muaffaqiyatli yaratildi', url: group.url };
  }

  async createChat(userName: string, body: any) {
    if (!body.user)
      throw new BadRequestException(
        "Suhbatdoshingizning email yoki userName'i kiritilishi shart!",
      );
    const target = await this.prisma.user.findFirst({
      where: { OR: [{ email: body.user }, { userName: body.user }] },
    });
    if (!target?.userName)
      throw new NotFoundException('Bunday foydalanuvchi topilmadi!');
    if (target.userName === userName)
      throw new BadRequestException("O'zingiz bilan chat ocha olmaysiz!");
    const chats = (await this.groups.findAll()).filter(
      (group: any) => group.type === 'chat',
    );
    const existing = chats.find((chat: any) => {
      const members = this.users(chat);
      return (
        (chat.founder === userName &&
          members.some((member) => member.userName === target.userName)) ||
        (chat.founder === target.userName &&
          members.some((member) => member.userName === userName))
      );
    });
    if (existing) {
      const users = this.users(existing).map((member) =>
        member.userName === userName || member.userName === target.userName
          ? { ...member, deleted: false }
          : member,
      );
      await this.updateGroupJson(existing.url, { users });
      return { message: 'Chat allaqachon mavjud', url: existing.url };
    }
    const chat = await this.groups.create({
      title: 'chat',
      securityLevel: 'private',
      logo: 'chat',
      founder: userName,
      type: 'chat',
      limit: body.limit || '1',
      users: [
        {
          userName: target.userName,
          email: target.email,
          permissions: this.permissions('chat'),
        },
      ],
      topics: [],
      defaults: this.permissions('chat'),
      description: body.description || '',
    } as any);
    return { message: 'chat muvaffaqiyatli yaratildi', url: chat.url };
  }

  async updateGroup(userName: string, url: string, body: any) {
    const group = await this.findGroup(url);
    const member = this.member(group, userName);
    if (group.founder !== userName && !member)
      throw new ForbiddenException("Siz bu guruh a'zosi emassiz");
    if (
      group.founder !== userName &&
      member?.permissions?.updateGroup !== true &&
      member?.updateGroup !== true
    )
      throw new ForbiddenException(
        "Sizda guruh ma'lumotlarini tahrirlash huquqi yo'q",
      );
    if (body.url && body.url !== url && (await this.groups.findByUrl(body.url)))
      throw new BadRequestException(
        'Bu url allaqachonBand qilingan, boshqa url tanlang',
      );
    const data: any = {};
    for (const field of ['url', 'title', 'description', 'limit'])
      if (body[field] !== undefined) data[field] = body[field];
    if (body.image !== undefined || body.logo !== undefined)
      data.logo = body.image || body.logo;
    await this.prisma.group.update({ where: { url }, data });
    return {
      message: "Guruh ma'lumotlari muvaffaqiyatli yangilandi",
      url: body.url || url,
    };
  }

  async leaveOrDeleteGroup(
    userName: string,
    url: string,
    action: 'leave' | 'delete',
    target: string,
  ) {
    const group = await this.findGroup(url);
    if (group.type !== 'group') throw new NotFoundException('Guruh topilmadi');
    const founder = group.founder === userName;
    if (action === 'delete') {
      if (!founder)
        throw new ForbiddenException(
          "Faqat guruh egasi (owner) guruhni o'chira oladi",
        );
      await this.groups.delete({ id: group.id });
      return "Guruh muvaffaqiyatli butunlay o'chirib yuborildi";
    }
    if (action !== 'leave')
      throw new BadRequestException("Noto'g'ri amal ko'rsatildi");
    const targetUser = target === 'self' ? userName : target;
    const members = this.users(group);
    if (targetUser === userName && founder)
      throw new ForbiddenException(
        "Guruh egasi guruhdan chiqib keta olmaydi. Avval guruhni o'chiring.",
      );
    const actor = this.member(group, userName);
    if (
      targetUser !== userName &&
      !founder &&
      actor?.permissions?.role !== 'admin' &&
      actor?.role !== 'admin'
    )
      throw new ForbiddenException(
        "Sizda boshqalarni guruhdan chiqarish huquqi yo'q",
      );
    if (group.founder === targetUser)
      throw new ForbiddenException('Guruh egasini chiqarib yuborib bo‘lmaydi');
    await this.updateGroupJson(url, {
      users: members.filter((member) => member.userName !== targetUser),
    });
    return targetUser === userName
      ? 'Guruhdan muvaffaqiyatli chiqdingiz'
      : 'Foydalanuvchi guruhdan chiqarib yuborildi';
  }

  async leaveOrDeleteChat(
    userName: string,
    url: string,
    action: 'leave' | 'delete' = 'leave',
  ) {
    const chat = await this.findGroup(url);
    if (chat.type !== 'chat') throw new NotFoundException('Chat topilmadi!');
    if (!this.isMember(chat, userName))
      throw new ForbiddenException('Siz bu chatga taalluqli emassiz!');
    if (action === 'delete') {
      await this.groups.delete({ id: chat.id });
      return { message: "Chat muvaffaqiyatli o'chirib yuborildi" };
    }
    if (action !== 'leave')
      throw new BadRequestException("Noto'g'ri amal ko'rsatildi");
    const members = this.users(chat);
    if (chat.founder === userName) {
      const next = members.find((member) => !member.deleted);
      if (!next) {
        await this.groups.delete({ id: chat.id });
        return { message: "Chat bo'shab qoldi va o'chirib yuborildi" };
      }
      await this.updateGroupJson(url, {
        founder: next.userName,
        users: members
          .filter((member) => member.userName !== next.userName)
          .concat({ userName, permissions: chat.defaults, deleted: true }),
      });
    } else
      await this.updateGroupJson(url, {
        users: members.map((member) =>
          member.userName === userName ? { ...member, deleted: true } : member,
        ),
      });
    return { message: 'Chatdan chiqdingiz' };
  }

  async createTopic(body: any, url: string, userName: string, logo: any) {
    if (!body.title)
      throw new BadRequestException(
        'Topic sarlavhasi (title) kiritilishi shart!',
      );
    const group = await this.findGroup(url);
    const member = this.member(group, userName);
    if (
      group.founder !== userName &&
      member?.permissions?.topic !== true &&
      member?.topic !== true
    )
      throw new ForbiddenException(
        "Siz bu guruhga topic qo'shishga haqli emassiz",
      );
    const permissions = {
      poll: true,
      crud: {
        create: {
          message: true,
          image: true,
          video: true,
          audio: true,
          poll: true,
        },
        delete: {
          message: true,
          image: true,
          video: true,
          audio: true,
          poll: true,
        },
      },
      pin: { message: true, image: true, video: true, audio: true, poll: true },
    };
    const topicUrl = body.url || `${url}-${Date.now()}`;
    const topic = {
      id: topicUrl,
      url: topicUrl,
      title: body.title,
      logo: logo?.buffer ? (await uploadImageToImgBB(logo)) || '' : '',
      defaults: permissions,
    };
    const members = this.users(group);
    members.forEach((item) => {
      item.topicPermissions ||= {};
      item.topicPermissions[topicUrl] = permissions;
    });
    await this.updateGroupJson(url, {
      topics: this.topics(group).concat(topic),
      users: members,
    });
    return {
      message:
        "Topic guruhga muvaffaqiyatli qo'shildi va barcha foydalanuvchilarga huquqlari biriktirildi",
      url: topicUrl,
    };
  }

  async updateTopic(
    userName: string,
    url: string,
    topicUrl: string,
    body: any,
  ) {
    const group = await this.findGroup(url);
    const member = this.member(group, userName);
    if (
      group.founder !== userName &&
      member?.permissions?.topic !== true &&
      member?.topic !== true
    )
      throw new ForbiddenException("Sizda topic'ni tahrirlash huquqi yo'q");
    const topics = this.topics(group);
    const index = topics.findIndex(
      (topic) => topic.url === topicUrl || topic.name === topicUrl,
    );
    if (index < 0)
      throw new NotFoundException('Tahrirlanadigan topic topilmadi');
    topics[index] = {
      ...topics[index],
      ...(body.title !== undefined && { title: body.title }),
      ...(body.image !== undefined && { image: body.image }),
      ...(body.url !== undefined && { url: body.url }),
    };
    await this.updateGroupJson(url, { topics });
    return { message: 'Topic muvaffaqiyatli tahrirlandi', data: topics[index] };
  }

  async deleteTopic(userName: string, url: string, topicUrl: string) {
    const group = await this.findGroup(url);
    const member = this.member(group, userName);
    if (
      group.founder !== userName &&
      member?.permissions?.topic !== true &&
      member?.permissions?.topic !== true
    )
      throw new ForbiddenException("Sizda topic'ni o'chirish huquqi yo'q");
    const topics = this.topics(group);
    const found = topics.find(
      (topic) =>
        topic.url === topicUrl ||
        topic.name === topicUrl ||
        topic.id === topicUrl,
    );
    const id = found?.id || topicUrl;
    const users = this.users(group).map((item) => {
      if (item.topicPermissions) delete item.topicPermissions[id];
      return item;
    });
    await this.updateGroupJson(url, {
      topics: topics.filter(
        (topic) =>
          topic.url !== topicUrl &&
          topic.name !== topicUrl &&
          topic.id !== topicUrl,
      ),
      users,
    });
    await this.prisma.message.deleteMany({
      where: { group: url, topic: topicUrl },
    });
    return "Topic va unga tegishli barcha huquqlar hamda xabarlar muvaffaqiyatli o'chirildi";
  }

  async getGroupDefaults(userName: string, url: string) {
    const group = await this.verifyOwner(userName, url);
    return group.defaults || null;
  }
  async getTopicDefaults(userName: string, url: string, topicUrl: string) {
    const group = await this.verifyOwner(userName, url);
    const topic = this.topics(group).find(
      (item) => item.url === topicUrl || item.name === topicUrl,
    );
    if (!topic)
      throw new NotFoundException("Guruh yoki ko'rsatilgan topic topilmadi");
    return topic.defaults || null;
  }
  async createGroupDefaults(userName: string, url: string, body: any) {
    const group = await this.verifyOwner(userName, url);
    const old = this.json(group.defaults, {});
    const changed =
      JSON.stringify({ poll: old.poll, crud: old.crud, pin: old.pin }) !==
      JSON.stringify({ poll: body.poll, crud: body.crud, pin: body.pin });
    const topics = changed
      ? this.topics(group).map((topic) => ({
          ...topic,
          defaults: { poll: body.poll, crud: body.crud, pin: body.pin },
        }))
      : this.topics(group);
    await this.updateGroupJson(url, {
      defaults: body,
      ...(changed && { topics }),
    });
    return changed
      ? "Guruh defaults va barcha mos keluvchi topic defaults'lari yangilandi"
      : "Guruh defaults (faqat guruhga xos qismi) yangilandi, topic'larga teginilmadi";
  }
  async createTopicDefaults(
    userName: string,
    url: string,
    topicUrl: string,
    body: any,
  ) {
    const group = await this.verifyOwner(userName, url);
    const topics = this.topics(group);
    const index = topics.findIndex(
      (topic) => topic.url === topicUrl || topic.name === topicUrl,
    );
    if (index < 0) throw new NotFoundException("Ko'rsatilgan topic topilmadi");
    topics[index] = {
      ...topics[index],
      defaults: { poll: body.poll, crud: body.crud, pin: body.pin },
    };
    await this.updateGroupJson(url, { topics });
    return 'Topic defaults yangilandi';
  }

  async addMembers(body: { members: string[] }, url: string, userName: string) {
    const group = await this.findGroup(url);
    const members = this.users(group);
    const current = this.member(group, userName);
    if (
      group.securityLevel === 'private' &&
      group.founder !== userName &&
      !(
        current?.permissions?.role === 'admin' &&
        current?.permissions?.addMembers === true
      )
    )
      throw new ForbiddenException(
        "Bu yopiq guruh/kanalga faqat adminlar a'zo qo'shishi mumkin!",
      );
    if (!Array.isArray(body.members) || !body.members.length)
      throw new BadRequestException(
        "Qo'shilishi kerak bo'lgan foydalanuvchilar ro'yxati (members) bo'sh yoki noto'g'ri formatda!",
      );
    const defaults = this.json(group.defaults, {});
    const topics = this.topics(group);
    const added: any[] = [];
    for (const name of body.members) {
      if (members.some((member) => member.userName === name)) continue;
      if (!(await this.prisma.user.findFirst({ where: { userName: name } })))
        throw new NotFoundException(
          `'@${name}' userName egasi bo'lgan foydalanuvchi bazadan topilmadi!`,
        );
      const topicPermissions: any = {};
      topics.forEach((topic) => {
        topicPermissions[topic.id || topic.url] = {
          poll: topic.defaults?.poll ?? defaults.poll ?? true,
          pin: topic.defaults?.pin || defaults.pin,
          crud: topic.defaults?.crud || defaults.crud,
        };
      });
      added.push({
        userName: name,
        deleted: false,
        permissions: {
          ...defaults,
          role: defaults.role || 'member',
          setTag: defaults.setTag || (group.type === 'chanel' ? [] : ['self']),
        },
        topicPermissions,
      });
    }
    if (!added.length)
      throw new BadRequestException(
        "Qo'shish uchun yangi foydalanuvchilar topilmadi (hammasi allaqachon guruhda bor).",
      );
    await this.updateGroupJson(url, { users: members.concat(added) });
    return "Foydalanuvchilar guruhga va topic'larga huquqlari bilan muvaffaqiyatli qo'shildi!";
  }
  async findUserRights(userName: string, target: string, url: string) {
    const group = await this.verifyOwner(userName, url);
    const member = this.member(group, target);
    if (!member)
      throw new NotFoundException('Foydalanuvchi bu guruhda topilmadi');
    return {
      ...(member.permissions || member),
      topicPermissions: member.topicPermissions || {},
    };
  }
  async updateUsersRights(userName: string, url: string, body: any) {
    const group = await this.verifyOwner(userName, url);
    const targets = body.users;
    if (!Array.isArray(targets) || !targets.length)
      throw new BadRequestException(
        "Yangilanishi kerak bo'lgan foydalanuvchilar (users) ro'yxati berilmadi!",
      );
    const members = this.users(group);
    const { users: ignored, topicPermissions, ...global } = body;
    targets.forEach((name: string) => {
      const member = members.find((item) => item.userName === name);
      if (member) {
        member.permissions = { ...(member.permissions || {}), ...global };
        if (topicPermissions)
          member.topicPermissions = {
            ...(member.topicPermissions || {}),
            ...topicPermissions,
          };
      }
    });
    await this.updateGroupJson(url, { users: members });
    return 'Tanlangan foydalanuvchilarning huquqlari muvaffaqiyatli yangilandi';
  }
}
