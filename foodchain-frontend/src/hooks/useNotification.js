import { toast } from 'react-hot-toast';

export const useNotification = () => {
  const showSuccess = (message) => {
    toast.success(message);
  };

  const showError = (message) => {
    toast.error(message);
  };

  const showLoading = (message) => {
    return toast.loading(message);
  };

  const showInfo = (message) => {
    toast(message);
  };

  return { showSuccess, showError, showLoading, showInfo };
};