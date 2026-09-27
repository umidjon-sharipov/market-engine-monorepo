import { Module } from '@nestjs/common';
import { VacanciesController } from './vacancies.controller';
import { VacanciesService } from './vacancies.service';
import { VacancyRepository } from './vacancy.repository';

@Module({
    controllers: [VacanciesController],
    providers: [VacanciesService, VacancyRepository],
})
export class VacanciesModule { }