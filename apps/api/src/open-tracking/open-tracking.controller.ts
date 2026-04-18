import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OpenTrackingService } from './open-tracking.service';
import { TRANSPARENT_GIF } from './transparent-pixel';

@Controller('track/opens')
export class OpenTrackingController {
  constructor(private readonly openTracking: OpenTrackingService) {}

  @Get(':token')
  async servePixel(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.openTracking.recordFirstOpen(token);
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(TRANSPARENT_GIF);
  }
}
