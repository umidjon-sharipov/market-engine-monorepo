import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';

import { GroupService } from './group.service';
import { GroupRepository } from './group.repository';
import { GroupAccessGuard } from './group-access.guard';

@Module({
  controllers: [GroupsController],
  providers: [GroupService, GroupRepository, GroupAccessGuard],
})
export class GroupsModule {}
