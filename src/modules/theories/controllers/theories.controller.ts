import { Controller } from '@nestjs/common';
import { TheoriesService } from '../services';

@Controller('theories')
export class TheoriesController {
  constructor(private readonly theoriesService: TheoriesService) {}
}
