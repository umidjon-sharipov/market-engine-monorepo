import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Get()
    async findAll() {
        return await this.messagesService.findAll();
    }

    @Get(':groupName/:topicName/message')
    @UseGuards(JwtAuthGuard)
    async messageData(
        @Req() req, 
        @Param('groupName') groupName: string, 
        @Param('topicName') topicName: string
    ) {
        const currentUserName = req.user.userName;
        return await this.messagesService.messageData(currentUserName, groupName, topicName);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'images', maxCount: 8 },
            { name: 'videos', maxCount: 3 },
            { name: 'audios', maxCount: 3 },
            { name: 'files', maxCount: 5 },
        ])
    )
    async sendMessage(
        @Req() req, 
        @Body() body: any, 
        @UploadedFiles() files: any
    ) {
        const currentUserName = req.user.userName;
        return await this.messagesService.sendMessage(currentUserName, files, body);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'images', maxCount: 8 },
            { name: 'videos', maxCount: 3 },
            { name: 'audios', maxCount: 3 },
            { name: 'files', maxCount: 5 },
        ])
    )
    async updateMessage(
        @Req() req,
        @Param('id') id: string,
        @Body() body: any,
        @UploadedFiles() files: any
    ) {
        const currentUserName = req.user.userName;
        return await this.messagesService.updateMessage(currentUserName, id, files, body);
    }

    @Patch(':id/reaction')
    @UseGuards(JwtAuthGuard)
    async toggleReaction(
        @Req() req,
        @Param('id') id: string,
        @Body() body: { emoji: string }
    ) {
        const currentUserName = req.user.userName;
        return await this.messagesService.toggleReaction(currentUserName, id, body.emoji);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteMessage(@Req() req, @Param('id') id: string) {
        const currentUserName = req.user.userName;
        return await this.messagesService.deleteMessage(currentUserName, id);
    }
}