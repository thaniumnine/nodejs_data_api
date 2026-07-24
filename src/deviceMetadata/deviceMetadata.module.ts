import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeviceMetadataController } from './deviceMetadata.controller';
import { DeviceMetadataService } from './deviceMetadata.service';


@Module({
  imports: [AuthModule],
  controllers: [DeviceMetadataController],
  providers: [DeviceMetadataService],
  exports: [DeviceMetadataService]
})
export class DeviceMetadataModule { }
