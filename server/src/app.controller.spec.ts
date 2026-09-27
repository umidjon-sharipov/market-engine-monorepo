import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { join } from 'path';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: 'DATABASE_POOL', useValue: { query: jest.fn() } },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should serve the homepage', () => {
      const response = { sendFile: jest.fn() };

      appController.getHomePage(response as never);

      expect(response.sendFile).toHaveBeenCalledWith(
        join(process.cwd(), 'public', 'index.html'),
      );
    });
  });
});
