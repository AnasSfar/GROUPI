import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ReferentialsModule } from './referentials/referentials.module';
import { TeacherProfileModule } from './teacher-profile/teacher-profile.module';
import { ParentProfileModule } from './parent-profile/parent-profile.module';
import { SchoolSituationModule } from './school-situation/school-situation.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AdminModule,
    ReferentialsModule,
    TeacherProfileModule,
    ParentProfileModule,
    SchoolSituationModule,
    GroupsModule,
  ],
})
export class AppModule {}
