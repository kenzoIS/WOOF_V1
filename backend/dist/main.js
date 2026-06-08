"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    });
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT ?? 3001);
    console.log(`🐾 WOOF Backend running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
//# sourceMappingURL=main.js.map