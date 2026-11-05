export class CreateUserDto {
  userName: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  image?: string;
  bio?: string;
  gender?: string;
}