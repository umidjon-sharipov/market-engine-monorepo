import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Delete,
  Param,
  Patch,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseEnumPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserRightsDto } from './dto/update-user-rights.dto';

import { GroupService } from './group.service';
import { GroupAccessGuard } from './group-access.guard';
import {
  AddMembersDto,
  CreateChatRequestDto,
  CreateGroupRequestDto,
  GroupAction,
  GroupDefaultsDto,
  TopicRequestDto,
  UpdateGroupRequestDto,
  UpdateTopicRequestDto,
} from './dto/groups.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupService: GroupService) {}

  // findAll
  @Get()
  async findAll() {
    return await this.groupService.findAll();
  }

  // ===================--------------------===================

  // find chats & groups
  @Get('data')
  @UseGuards(JwtAuthGuard)
  async findGroups(@Req() req) {
    const currentUserName = req.user.userName;
    return await this.groupService.findGroups(currentUserName);
  }

  // find current group data
  @Get('find/group/:group')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async findGroupData(@Req() req, @Param('group') group) {
    const currentUserName = req.user.userName;
    return await this.groupService.findGroupData(currentUserName, group);
  }

  // find current group>topic data
  @Get('find/topic/:group/:topic')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async findTopicData(
    @Req() req,
    @Param('group') group,
    @Param('topic') topic,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.findTopicData(currentUserName, group, topic);
  }

  // find contacts
  @Get('find/contacts')
  @UseGuards(JwtAuthGuard)
  async findContacts(@Req() req) {
    const currentUserName = req.user.userName;
    return await this.groupService.findContacts(currentUserName);
  }

  // ===================--------------------===================

  // create group
  @Post('group')
  @UseGuards(JwtAuthGuard)
  async createGroup(@Req() req, @Body() body: CreateGroupRequestDto) {
    const currentUserName = req.user.userName;
    return await this.groupService.createGroup(currentUserName, body);
  }

  // create chat
  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async createChat(@Req() req, @Body() body: CreateChatRequestDto) {
    const currentUserName = req.user.userName;
    return await this.groupService.createChat(currentUserName, body);
  }

  // update group
  @Post('group/update/:group')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async updateGroup(
    @Req() req,
    @Param('group') group: string,
    @Body() body: UpdateGroupRequestDto,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.updateGroup(currentUserName, group, body);
  }

  // leave or delete group
  @Delete('group/:group/:action/:user')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async leaveOrDeleteGroup(
    @Req() req,
    @Param('group') group: string,
    @Param('action', new ParseEnumPipe(GroupAction)) action: GroupAction,
    @Param('user') user: string,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.leaveOrDeleteGroup(
      currentUserName,
      group,
      action || 'leave',
      user,
    );
  }

  // leave or delete chat
  @Delete('chat/:chat/:action/:user')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async leaveOrDeleteChat(
    @Req() req,
    @Param('chat') chat: string,
    @Param('action', new ParseEnumPipe(GroupAction))
    action: GroupAction = GroupAction.leave,
  ) {
    const currentUserName = req.user.userName;

    return await this.groupService.leaveOrDeleteChat(
      currentUserName,
      chat,
      action,
    );
  }

  // ===================--------------------===================

  // create topic
  @Post('topic/:group')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  @UseInterceptors(FileInterceptor('logo'))
  async createTopic(
    @Req() req,
    @Param('group') group: string,
    @Body() body: TopicRequestDto,
    @UploadedFile() logo: { buffer: Buffer; originalname: string },
  ) {
    if (!logo) {
      throw new BadRequestException(
        `Topic uchun logo (rasm) majburiy! ${logo}`,
      );
    }

    const currentUserName = req.user.userName;
    return await this.groupService.createTopic(
      body,
      group,
      currentUserName,
      logo,
    );
  }

  // update topic
  @Post('topic/update/:group/:topic')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async updateTopic(
    @Req() req,
    @Param('group') group,
    @Param('topic') topic: string,
    @Body() body: UpdateTopicRequestDto,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.updateTopic(
      currentUserName,
      group,
      topic,
      body,
    );
  }

  // delete topic
  @Delete('topic/:group/:topic')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async deleteTopic(
    @Req() req,
    @Param('group') group: string,
    @Param('topic') topic: string,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.deleteTopic(currentUserName, group, topic);
  }

  // ===================--------------------===================

  // find group defaults
  @Get('defaults/:group')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async getGroupDefaults(@Param('group') group: string, @Req() req: any) {
    const currentUserName = req.user.userName;
    return await this.groupService.getGroupDefaults(currentUserName, group);
  }

  // find group>topic defaults
  @Get('defaults/:group/:topic')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async getTopicDefaults(
    @Param('group') group: string,
    @Param('topic') topic: string,
    @Req() req: any,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.getTopicDefaults(
      currentUserName,
      group,
      topic,
    );
  }

  // create group defaults
  @Post('defaults/:group')
  @UseGuards(JwtAuthGuard, GroupAccessGuard)
  async createGroupDefaults(
    @Req() req,
    @Param('group') group: string,
    @Body() body: GroupDefaultsDto,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.createGroupDefaults(
      currentUserName,
      group,
      body,
    );
  }

  // create group>topic defaults
  @Post('defaults/:group/:topic')
  @UseGuards(JwtAuthGuard)
  async createTopicDefaults(
    @Req() req,
    @Param('group') group: string,
    @Param('topic') topic: string,
    @Body() body: GroupDefaultsDto,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.createTopicDefaults(
      currentUserName,
      group,
      topic,
      body,
    );
  }

  // ===================--------------------===================

  // add members to group
  @Post('members/addMembers/:group')
  @UseGuards(JwtAuthGuard)
  async addMembers(
    @Req() req,
    @Param('group') group: string,
    @Body() body: AddMembersDto,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.addMembers(body, group, currentUserName);
  }

  // find user rights
  @Get('members/:group/:user')
  @UseGuards(JwtAuthGuard)
  async findUserRights(
    @Req() req,
    @Param('user') user: string,
    @Param('group') group: string,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.findUserRights(currentUserName, user, group);
  }

  // create | update users rights
  @Post('members/:group')
  @UseGuards(JwtAuthGuard)
  async updateUsersRights(
    @Req() req,
    @Body() body: UpdateUserRightsDto,
    @Param('group') group: string,
  ) {
    const currentUserName = req.user.userName;
    return await this.groupService.updateUsersRights(
      currentUserName,
      group,
      body,
    );
  }
}
