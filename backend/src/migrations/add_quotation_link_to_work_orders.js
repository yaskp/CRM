"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Migration: Add quotation_id, client_scope, contractor_scope to work_orders if not present
 * Run: npx ts-node src/migrations/add_quotation_link_to_work_orders.ts
 */
var connection_1 = require("../database/connection");
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var qi, tableDesc, existingCols, toAdd, _i, toAdd_1, _a, col, sql, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                return [4 /*yield*/, connection_1.sequelize.authenticate()];
            case 1:
                _b.sent();
                console.log('✅ DB connected');
                qi = connection_1.sequelize.getQueryInterface();
                return [4 /*yield*/, connection_1.sequelize.query("DESCRIBE work_orders")];
            case 2:
                tableDesc = _b.sent();
                existingCols = tableDesc[0].map(function (r) { return r.Field; });
                console.log('Existing columns:', existingCols.join(', '));
                toAdd = [
                    {
                        col: 'quotation_id',
                        sql: 'ALTER TABLE work_orders ADD COLUMN quotation_id INT NULL REFERENCES quotations(id)'
                    },
                    {
                        col: 'client_scope',
                        sql: 'ALTER TABLE work_orders ADD COLUMN client_scope TEXT NULL'
                    },
                    {
                        col: 'contractor_scope',
                        sql: 'ALTER TABLE work_orders ADD COLUMN contractor_scope TEXT NULL'
                    },
                    {
                        col: 'quote_type',
                        sql: "ALTER TABLE work_orders ADD COLUMN quote_type ENUM('with_material','labour_only') NULL DEFAULT 'with_material'"
                    },
                    {
                        col: 'boq_id',
                        sql: 'ALTER TABLE work_orders ADD COLUMN boq_id INT NULL'
                    },
                    {
                        col: 'created_by',
                        sql: 'ALTER TABLE work_orders ADD COLUMN created_by INT NULL'
                    }
                ];
                _i = 0, toAdd_1 = toAdd;
                _b.label = 3;
            case 3:
                if (!(_i < toAdd_1.length)) return [3 /*break*/, 7];
                _a = toAdd_1[_i], col = _a.col, sql = _a.sql;
                if (!!existingCols.includes(col)) return [3 /*break*/, 5];
                return [4 /*yield*/, connection_1.sequelize.query(sql)];
            case 4:
                _b.sent();
                console.log("\u2705 Added column: ".concat(col));
                return [3 /*break*/, 6];
            case 5:
                console.log("\u23ED  Skipped (already exists): ".concat(col));
                _b.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 3];
            case 7:
                console.log('\n✅ Migration complete!');
                process.exit(0);
                return [3 /*break*/, 9];
            case 8:
                err_1 = _b.sent();
                console.error('❌ Migration failed:', err_1.message);
                process.exit(1);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
run();
