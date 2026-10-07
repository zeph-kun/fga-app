"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FgaModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const fga_controller_1 = require("./fga.controller");
const fga_service_1 = require("./fga.service");
const engine_1 = require("./engine");
const config_1 = require("./config");
const pg_repository_1 = require("./pg-repository");
const model_1 = require("./model");
let FgaModule = class FgaModule {
};
exports.FgaModule = FgaModule;
exports.FgaModule = FgaModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [fga_controller_1.FgaController],
        providers: [
            { provide: 'NAMESPACE_CONFIG', useValue: config_1.FGA_CONFIG },
            { provide: model_1.TUPLE_REPOSITORY, useClass: pg_repository_1.PgTupleRepository },
            {
                provide: engine_1.FgaEngine,
                useFactory: (repo, config) => new engine_1.FgaEngine(repo, config),
                inject: [model_1.TUPLE_REPOSITORY, 'NAMESPACE_CONFIG'],
            },
            fga_service_1.FgaService,
        ],
        exports: [fga_service_1.FgaService, model_1.TUPLE_REPOSITORY],
    })
], FgaModule);
//# sourceMappingURL=fga.module.js.map