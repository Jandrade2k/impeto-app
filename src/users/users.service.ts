import { Injectable, InternalServerErrorException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { UserRole } from './user-roles.enum';
import { NotFoundError } from 'rxjs';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUserQueryDto } from './dto/find-users-query.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserRepository)
        private userRepository: UserRepository,
    ) { }

    async createAdminUser(createUserDto: CreateUserDto): Promise<User> {
        if (createUserDto.password != createUserDto.passwordConfirmation) {
            throw new UnprocessableEntityException('As senhas não coincidem');
        } else {
            return this.userRepository.createUser(createUserDto, UserRole.ADMIN);
        }
    }

    async findUserById(userId: string): Promise<User> {
        const user = await this.userRepository.findOne(userId, {
            select: ['email', 'name', 'last_name', 'role', 'id'],
        });

        if (!user) throw new NotFoundException('Usuário não encontrado');

        return user;
    }

    async updateUser(updateUserDto: UpdateUserDto, id:string): Promise<User> {
        const user = await this.findUserById(id);
        const {name, lastName, email, role, active} = updateUserDto;
        user.name = name ? name : user.name;
        user.last_name = lastName ? lastName : user.last_name;
        user.email = email ? email : user.email;
        user.role = role ? role : user.role;
        user.active = active === undefined ? active : user.active;

        try {
            await user.save();
            return user;
        } catch (error) {
            throw new InternalServerErrorException('Erro ao salvar alteração no banco de dados')
        }
    }

    async deleteUser(userId:string) {
        const result = await this.userRepository.delete({id: userId});
        if (result.affected === 0) {
            throw new NotFoundException('Usuário não encontrado')
        }
    }

    async findUsers(
        queryDto: FindUserQueryDto,
    ): Promise<{users: User[], total:number}> {
        const users = await this.userRepository.findUsers(queryDto)
        return users;
    }
}