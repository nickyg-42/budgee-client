import { apiService } from './api';

export const usePlaidIntegration = () => {
  const createLinkToken = async () => {
    try {
      const response = await apiService.createLinkToken();
      return response.link_token;
    } catch (error) {
      console.error('Failed to create link token:', error);
      throw error;
    }
  };

  const exchangePublicToken = async (publicToken: string) => {
    try {
      const response = await apiService.exchangePublicToken(publicToken);
      return response;
    } catch (error) {
      console.error('Failed to exchange public token:', error);
      throw error;
    }
  };

  return {
    createLinkToken,
    exchangePublicToken,
  };
};