"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ICONS = exports.getIcon = void 0;
const RocketOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/RocketOutlined"));
const CheckCircleOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/CheckCircleOutlined"));
const ReloadOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/ReloadOutlined"));
const ThunderboltOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/ThunderboltOutlined"));
const WalletOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/WalletOutlined"));
const BlockOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/BlockOutlined"));
const SearchOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/SearchOutlined"));
const WarningOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/WarningOutlined"));
const DeleteOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/DeleteOutlined"));
const DownOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/DownOutlined"));
const UpOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/UpOutlined"));
const GlobalOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/GlobalOutlined"));
const PlusOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/PlusOutlined"));
const ToolOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/ToolOutlined"));
const ExperimentOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/ExperimentOutlined"));
const UserOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/UserOutlined"));
const CopyOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/CopyOutlined"));
const FileTextOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/FileTextOutlined"));
const FolderOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/FolderOutlined"));
const KeyOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/KeyOutlined"));
const FireOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/FireOutlined"));
const SendOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/SendOutlined"));
const MergeCellsOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/MergeCellsOutlined"));
const SplitCellsOutlined_1 = __importDefault(require("@ant-design/icons-svg/lib/asn/SplitCellsOutlined"));
function renderIconDefinitionToSVG(icond) {
    const { tag, attrs, children } = icond;
    const attrsString = Object.entries(attrs || {})
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
    let content = '';
    if (children && children.length > 0) {
        content = children.map((c) => renderIconDefinitionToSVG(c)).join('');
    }
    return `<${tag} ${attrsString}>${content}</${tag}>`;
}
/**
 * Returns an SVG string for the given Ant icon definition.
 *
 * @param iconDef The icon definition object from @ant-design/icons-svg
 * @param className Optional CSS class to add to the SVG element
 * @returns A formatted SVG string
 */
const getIcon = (iconDef, className = '') => {
    const svg = renderIconDefinitionToSVG(iconDef.icon);
    // Add our custom class for styling and accessibility
    return svg.replace('<svg ', `<svg class="ant-icon ${className}" fill="currentColor" width="1em" height="1em" aria-hidden="true" focusable="false" `);
};
exports.getIcon = getIcon;
exports.ICONS = {
    ROCKET: RocketOutlined_1.default,
    CHECK: CheckCircleOutlined_1.default,
    RELOAD: ReloadOutlined_1.default,
    THUNDERBOLT: ThunderboltOutlined_1.default,
    WALLET: WalletOutlined_1.default,
    PACKAGE: BlockOutlined_1.default,
    SEARCH: SearchOutlined_1.default,
    WARNING: WarningOutlined_1.default,
    DELETE: DeleteOutlined_1.default,
    DOWN: DownOutlined_1.default,
    UP: UpOutlined_1.default,
    GLOBAL: GlobalOutlined_1.default,
    PLUS: PlusOutlined_1.default,
    TOOL: ToolOutlined_1.default,
    EXPERIMENT: ExperimentOutlined_1.default,
    USER: UserOutlined_1.default,
    COPY: CopyOutlined_1.default,
    FILE_TEXT: FileTextOutlined_1.default,
    FOLDER: FolderOutlined_1.default,
    KEY: KeyOutlined_1.default,
    FIRE: FireOutlined_1.default,
    SEND: SendOutlined_1.default,
    MERGE: MergeCellsOutlined_1.default,
    SPLIT: SplitCellsOutlined_1.default,
};
//# sourceMappingURL=icons.js.map