import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SearchGroupsQueryDto } from './dto/search-groups-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  /** Ch.10.5 : recherche publique — ouverte à tout compte Parent authentifié. */
  @Get('search')
  @Roles(Role.PARENT)
  search(@Query() query: SearchGroupsQueryDto) {
    return this.service.search(query);
  }

  @Get('mine')
  @Roles(Role.TEACHER)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMine(user.id);
  }

  @Post()
  @Roles(Role.TEACHER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupDto) {
    return this.service.create(user.id, dto);
  }

  @Get(':id')
  @Roles(Role.TEACHER)
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.getOne(user.id, id);
  }

  @Patch(':id')
  @Roles(Role.TEACHER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Post(':id/open')
  @Roles(Role.TEACHER)
  open(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.open(user.id, id);
  }

  @Post(':id/close')
  @Roles(Role.TEACHER)
  close(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.close(user.id, id);
  }

  @Post(':id/archive')
  @Roles(Role.TEACHER)
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.archive(user.id, id);
  }

  @Delete(':id')
  @Roles(Role.TEACHER)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
