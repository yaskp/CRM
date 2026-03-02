import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import type { NotificationInstance } from 'antd/es/notification/interface';

let message: MessageInstance;
let notification: NotificationInstance;
let modal: ModalStaticFunctions;

/**
 * This component handles the static access to antd's message, notification and modal
 * inside the App context. Must be rendered once inside <AntdApp>.
 */
export const AntdGlobalHelper = () => {
    const staticFunction = App.useApp();
    message = staticFunction.message;
    notification = staticFunction.notification;
    modal = (staticFunction.modal as unknown) as ModalStaticFunctions;
    return null;
};

export { message, notification, modal };
