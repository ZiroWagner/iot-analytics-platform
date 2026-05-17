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
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from '@/auth/interfaces/http/dto/auth.dto';
import { RegisterUserUseCase } from '@/auth/application/use-cases/register-user.use-case';
import { GenerateTokenUseCase } from '@/auth/application/use-cases/generate-token.use-case';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly generateTokenUseCase: GenerateTokenUseCase,
    private readonly configService: ConfigService,
  ) { }

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
  googleAuth() {
    // Passport redirects to Google; no body needed.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    this.handleOAuthCallback(req, res);
  }

  @ApiOperation({ summary: 'Autenticación con GitHub' })
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Passport redirects to GitHub; no body needed.
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    this.handleOAuthCallback(req, res);
  }

  /**
   * Shared handler for OAuth provider callbacks (Google / GitHub).
   * Generates a JWT and redirects the user to the frontend callback page.
   */
  private handleOAuthCallback(req: Request, res: Response): void {
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
