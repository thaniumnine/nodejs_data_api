import { Controller, Get } from '@nestjs/common';

@Controller('')
export class HomeController {

  
  @Get()
  home() {
    return "Visit thaniumnine.com for more information."
  }
}
