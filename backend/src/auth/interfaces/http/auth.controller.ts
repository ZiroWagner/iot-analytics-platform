import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/auth.dto';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { GenerateTokenUseCase } from '../../application/use-cases/generate-token.use-case';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly generateTokenUseCase: GenerateTokenUseCase,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiBody({ type: RegisterDto })
  @Post('register')
  async register(
    @Body(new ValidationPipe({ whitelist: true })) body: RegisterDto,
  ) {
    const user = await this.registerUserUseCase.execute({
      email: body.email,
      password: body.password,
      name: body.name,
    });
    return this.generateTokenUseCase.execute(user);
  }

  @ApiOperation({ summary: 'Iniciar sesión local' })
  @ApiResponse({ status: 200, description: 'Sesión iniciada' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Req() req: Request) {
    return this.generateTokenUseCase.execute(req.user as any);
  }

  @ApiOperation({ summary: 'Autenticación con Google' })
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as {
      id: string;
      email: string;
      name?: string;
      image?: string;
    };
    const jwt = this.generateTokenUseCase.execute(user);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${jwt.access_token}`);
  }

  @ApiOperation({ summary: 'Autenticación con GitHub' })
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as {
      id: string;
      email: string;
      name?: string;
      image?: string;
    };
    const jwt = this.generateTokenUseCase.execute(user);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${jwt.access_token}`);
  }
}
