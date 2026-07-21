import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const SWAGGER_PATH = 'docs';
const DEFAULT_PORT = 4000;
const DEFAULT_CLIENT_URLS = 'http://localhost:3000,http://localhost:5173';

function allowedOrigins(): string[] {
  return (process.env.CLIENT_URL ?? DEFAULT_CLIENT_URLS)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: allowedOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  const port = process.env.PORT ?? DEFAULT_PORT;
  await app.listen(port);

  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Swagger docs on    http://localhost:${port}/${SWAGGER_PATH}`);
}

function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Finance Tracker API')
    .setDescription(
      'Авторизация построена на httpOnly-куках: токены ставятся автоматически ' +
        'и не видны из JavaScript. Достаточно выполнить /auth/login — ' +
        'браузер сам приложит куки к следующим запросам.',
    )
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: {
      withCredentials: true,
      persistAuthorization: true,
    },
  });
}

bootstrap();
