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
  Patch,
  Delete,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from '@/auth/interfaces/http/dto/auth.dto';
import { UpdateProfileDto } from '@/auth/interfaces/http/dto/update-profile.dto';
import { RegisterUserUseCase } from '@/auth/application/use-cases/register-user.use-case';
import { GenerateTokenUseCase } from '@/auth/application/use-cases/generate-token.use-case';
import { UpdateProfileUseCase } from '@/auth/application/use-cases/update-profile.use-case';
import { DeleteUserUseCase } from '@/auth/application/use-cases/delete-user.use-case';
import { USER_REPOSITORY_TOKEN } from '@/auth/domain/repositories/user.repository.interface';
import type { UserRepositoryInterface } from '@/auth/domain/repositories/user.repository.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';

interface JwtUser {
  sub: string;
  email: string;
}

@ApiTags('Auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly generateTokenUseCase: GenerateTokenUseCase,
    private readonly configService: ConfigService,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: UserRepositoryInterface,
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

  @ApiOperation({ summary: 'Obtener perfil del usuario' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario obtenido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req: { user: JwtUser }) {
    const user = await this.userRepository.findById(req.user.sub);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      hasPassword: user.hasPassword(),
    };
  }

  @ApiOperation({ summary: 'Actualizar perfil del usuario' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(
    @Req() req: { user: JwtUser },
    @Body(new ValidationPipe({ whitelist: true })) body: UpdateProfileDto,
  ) {
    const user = await this.updateProfileUseCase.execute(req.user.sub, body);
    return this.generateTokenUseCase.execute(user);
  }

  @ApiOperation({ summary: 'Eliminar cuenta de usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('profile')
  async deleteProfile(@Req() req: { user: JwtUser }) {
    await this.deleteUserUseCase.execute(req.user.sub);
    return { success: true };
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
