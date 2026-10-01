import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VacancyRepository } from './vacancy.repository';
import { CreateVacancyDto } from './dto/create-vacancy.dto';
import { uploadImageToImgBB } from '../common/helpers/image-upload.helper';

@Injectable()
export class VacanciesService {
  constructor(
    private readonly vacancies: VacancyRepository,
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.vacancies.findAll({
      orderBy: { createdAt: 'desc' },
      include: { market: { select: { id: true, title: true, logo: true } }, workers: true },
    });
  }

  findByMarketId(marketId: string) {
    return this.vacancies.findAll({
      where: { marketId },
      orderBy: { createdAt: 'desc' },
      include: { workers: true },
    });
  }

  async create(body: CreateVacancyDto, file: { buffer: Buffer; originalname: string }) {
    if (!file) {
      throw new BadRequestException('Rasm yuklanishi shart!');
    }

    const imageUrl = await uploadImageToImgBB(file);
    return this.vacancies.create(this.toCreateInput(body, imageUrl));
  }

  async applyToVacancy(
    vacancyId: string,
    userEmail: string,
    file?: { buffer: Buffer; originalname: string },
    message?: string,
  ) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) {
      throw new NotFoundException('Vakansiya topilmadi!');
    }

    const applicants = Array.isArray(vacancy.applicants) ? vacancy.applicants : [];
    if (applicants.some((app: any) => app?.email === userEmail)) {
      throw new BadRequestException('Siz allaqachon bu vakansiyaga ariza topshirgansiz!');
    }

    const image = file ? await uploadImageToImgBB(file) : null;
    const applicant = { email: userEmail, message: message || '', image, rate: null };

    const updated = await this.prisma.vacancy.update({
      where: { id: vacancyId },
      data: {
        applicants: [...applicants, applicant],
      },
    });

    return { message: 'Ariza muvaffaqiyatli yuborildi!', vacancy: updated };
  }

  findOne(id: string) {
    return this.vacancies.findOne({ id });
  }

  delete(id: string) {
    return this.vacancies.delete({ id });
  }

  async getVacancyData(vacancyId: string, userEmail: string) {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { id: vacancyId },
      include: { workers: true },
    });

    if (!vacancy) {
      throw new NotFoundException('Vakansiya topilmadi!');
    }

    const isOwnerOrAdmin = !!userEmail && !!(await this.prisma.market.findFirst({
      where: { id: vacancy.marketId ?? undefined, email: userEmail },
      select: { id: true },
    }));

    const applicants = Array.isArray(vacancy.applicants) ? vacancy.applicants : [];
    const applicantsCount = applicants.length;

    if (!isOwnerOrAdmin) {
      return {
        ...vacancy,
        applicants: undefined,
        applicantsCount,
        matchedUsers: [],
        isOwner: false,
      };
    }

    const applicantEmails = applicants
      .map((app: any) => app?.email)
      .filter((email: string) => !!email);

    const users = applicantEmails.length
      ? await this.prisma.user.findMany({
          where: { email: { in: applicantEmails } },
        })
      : [];

    const matchedUsers = users.map((user) => {
      const applicantData = applicants.find((app: any) => app?.email === user.email) as
        | { message?: string; rate?: number | null; image?: string | null }
        | undefined;
      const isAccepted = vacancy.workers.some((worker) => worker.userId === user.id);

      return {
        ...user,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Ism kiritilmagan',
        phone: user.phone || 'Kiritilmagan',
        bio: user.bio || 'Kiritilmagan',
        message: applicantData?.message || 'Xabar yo\'q',
        rate: applicantData?.rate ?? null,
        applicantImage: applicantData?.image || user.image,
        isAccepted,
      };
    });

    return {
      ...vacancy,
      applicantsCount,
      matchedUsers,
      isOwner: true,
    };
  }

  async rateToVacancy(vacancyId: string, targetEmail: string, rate: number) {
    const vacancy = await this.prisma.vacancy.findUnique({ where: { id: vacancyId } });
    if (!vacancy) {
      throw new NotFoundException('Vakansiya topilmadi!');
    }

    const rawApplicants = vacancy.applicants;
    const applicants: any[] = Array.isArray(rawApplicants)
      ? rawApplicants
      : (rawApplicants as any)?.set && Array.isArray((rawApplicants as any).set)
      ? (rawApplicants as any).set
      : [];

    const targetApplicant = applicants.find((app: any) => app?.email === targetEmail);
    if (!targetApplicant) {
      throw new BadRequestException('Bu nomzod ushbu vakansiyaga ariza topshirmagan!');
    }

    const updatedApplicants = applicants.map((app: any) => {
      if (app?.email === targetEmail) {
        return {
          ...app,
          rate: Number(rate),
        };
      }
      return app;
    });

    const updated = await this.prisma.vacancy.update({
      where: { id: vacancyId },
      data: {
        applicants: updatedApplicants,
      },
    });

    return { ok: true, message: 'Nomzod baholandi!', vacancy: updated };
  }

  private toCreateInput(body: CreateVacancyDto, imageUrl: string): Prisma.VacancyCreateInput {
    return {
      title: body.title,
      requiredRole: body.requiredRole,
      jobType: body.jobType,
      requiredWorkers: Number(body.requiredWorkers),
      salary: body.salary !== undefined && body.salary !== null && body.salary !== ('' as any)
        ? Number(body.salary) 
        : undefined,
      image: imageUrl,
      skills: body.skills,
      experience: body.experience,
      description: body.description,
      benefits: body.benefits,
      hrName: body.hrName,
      hrPhone: body.hrPhone,
      hrLink: body.hrLink,
      market: { connect: { id: body.marketId } },
    };
  }
}