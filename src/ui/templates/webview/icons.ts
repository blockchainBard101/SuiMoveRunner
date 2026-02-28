import RocketOutlined from '@ant-design/icons-svg/lib/asn/RocketOutlined';
import CheckCircleOutlined from '@ant-design/icons-svg/lib/asn/CheckCircleOutlined';
import ReloadOutlined from '@ant-design/icons-svg/lib/asn/ReloadOutlined';
import ThunderboltOutlined from '@ant-design/icons-svg/lib/asn/ThunderboltOutlined';
import WalletOutlined from '@ant-design/icons-svg/lib/asn/WalletOutlined';
import BlockOutlined from '@ant-design/icons-svg/lib/asn/BlockOutlined';
import SearchOutlined from '@ant-design/icons-svg/lib/asn/SearchOutlined';
import WarningOutlined from '@ant-design/icons-svg/lib/asn/WarningOutlined';
import DeleteOutlined from '@ant-design/icons-svg/lib/asn/DeleteOutlined';
import DownOutlined from '@ant-design/icons-svg/lib/asn/DownOutlined';
import UpOutlined from '@ant-design/icons-svg/lib/asn/UpOutlined';
import GlobalOutlined from '@ant-design/icons-svg/lib/asn/GlobalOutlined';
import PlusOutlined from '@ant-design/icons-svg/lib/asn/PlusOutlined';
import ToolOutlined from '@ant-design/icons-svg/lib/asn/ToolOutlined';
import ExperimentOutlined from '@ant-design/icons-svg/lib/asn/ExperimentOutlined';
import UserOutlined from '@ant-design/icons-svg/lib/asn/UserOutlined';
import CopyOutlined from '@ant-design/icons-svg/lib/asn/CopyOutlined';
import FileTextOutlined from '@ant-design/icons-svg/lib/asn/FileTextOutlined';
import FolderOutlined from '@ant-design/icons-svg/lib/asn/FolderOutlined';
import KeyOutlined from '@ant-design/icons-svg/lib/asn/KeyOutlined';
import FireOutlined from '@ant-design/icons-svg/lib/asn/FireOutlined';
import SendOutlined from '@ant-design/icons-svg/lib/asn/SendOutlined';
import MergeCellsOutlined from '@ant-design/icons-svg/lib/asn/MergeCellsOutlined';
import SplitCellsOutlined from '@ant-design/icons-svg/lib/asn/SplitCellsOutlined';

function renderIconDefinitionToSVG(icond: any): string {
    const { tag, attrs, children } = icond;
    const attrsString = Object.entries(attrs || {})
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');

    let content = '';
    if (children && children.length > 0) {
        content = children.map((c: any) => renderIconDefinitionToSVG(c)).join('');
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
export const getIcon = (iconDef: any, className: string = '') => {
    const svg = renderIconDefinitionToSVG(iconDef.icon);
    // Add our custom class for styling and accessibility
    return svg.replace('<svg ', `<svg class="ant-icon ${className}" fill="currentColor" width="1em" height="1em" aria-hidden="true" focusable="false" `);
};

export const ICONS = {
    ROCKET: RocketOutlined,
    CHECK: CheckCircleOutlined,
    RELOAD: ReloadOutlined,
    THUNDERBOLT: ThunderboltOutlined,
    WALLET: WalletOutlined,
    PACKAGE: BlockOutlined,
    SEARCH: SearchOutlined,
    WARNING: WarningOutlined,
    DELETE: DeleteOutlined,
    DOWN: DownOutlined,
    UP: UpOutlined,
    GLOBAL: GlobalOutlined,
    PLUS: PlusOutlined,
    TOOL: ToolOutlined,
    EXPERIMENT: ExperimentOutlined,
    USER: UserOutlined,
    COPY: CopyOutlined,
    FILE_TEXT: FileTextOutlined,
    FOLDER: FolderOutlined,
    KEY: KeyOutlined,
    FIRE: FireOutlined,
    SEND: SendOutlined,
    MERGE: MergeCellsOutlined,
    SPLIT: SplitCellsOutlined,
};
