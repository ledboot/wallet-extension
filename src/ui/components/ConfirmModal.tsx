import { useLanguage } from '@/ui/contexts/LanguageContext';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
}: ConfirmModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className='modal-open modal'>
      <div className='modal-box bg-base-100'>
        <h3 className='text-lg font-bold text-gray-900'>
          {title || t('common.confirm')}
        </h3>
        <p className='py-4 text-sm text-gray-600'>{message}</p>
        <div className='modal-action'>
          <button className='btn' onClick={onCancel}>
            {cancelText || t('common.cancel')}
          </button>
          <button className='btn btn-error text-white' onClick={onConfirm}>
            {confirmText || t('common.confirm')}
          </button>
        </div>
      </div>
      <form method='dialog' className='modal-backdrop' onClick={onCancel}>
        <button className='cursor-default'>close</button>
      </form>
    </div>
  );
}
