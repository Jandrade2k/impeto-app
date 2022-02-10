import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { CredentialsDto } from 'src/users/dto/credentials.dto';
import { UserRole } from 'src/users/user-roles.enum';
import { User } from 'src/users/user.entity';
import { UserRepository } from 'src/users/users.repository';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(UserRepository)
        private userRepository: UserRepository,
        private jwtService: JwtService,
    ){}

    async singUp(createUserDto: CreateUserDto): Promise<User> {
        if (createUserDto.password != createUserDto.passwordConfirmation) {
            throw new UnprocessableEntityException('As senhas não coincidem')
        } else {
            return await this.userRepository.createUser(createUserDto, UserRole.USER);
        }
    }

    async signIn(credentialsDto: CredentialsDto) {
        const user = await this.userRepository.checkCredentials(credentialsDto);

        if (user === null) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const jwtPayload = {
            id: user.id,
        }

        const token = await this.jwtService.sign(jwtPayload);

        return {token};
    }
}
