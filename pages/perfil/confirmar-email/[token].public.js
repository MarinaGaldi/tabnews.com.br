import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Box, Confetti, DefaultLayout, Flash } from '@/TabNewsUI';
import { createErrorMessage, useUser } from 'pages/interface';

export default function ConfirmEmail() {
  const router = useRouter();
  const { token } = router.query;
  const { fetchUser } = useUser();
  const [globalMessage, setGlobalMessage] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailConfirmation = async (token, updateUserCache) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/v1/email-confirmation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: token,
        }),
      });

      if (response.status === 200) {
        setIsSuccess(true);
        setGlobalMessage('Seu email foi alterado com sucesso!');
        updateUserCache();
        return;
      }

      if (response.status >= 400 && response.status <= 503) {
        const responseBody = await response.json();
        setGlobalMessage(
          createErrorMessage(responseBody, {
            omitErrorId: [400, 404].includes(response.status),
          }),
        );
        setIsSuccess(false);
        return;
      }

      setIsSuccess(false);
      throw new Error(response.statusText);
    } catch (error) {
      setGlobalMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleEmailConfirmation(token, fetchUser);
    }
  }, [fetchUser, token]);

  return (
    <>
      {isSuccess && <Confetti />}
      <DefaultLayout containerWidth="medium" metadata={{ title: 'Confirmar alteração de email' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', mt: 10 }}>
          {isLoading ? (
            <Flash variant="default">Verificando Token de Alteração de Email...</Flash>
          ) : (
            <Flash variant={isSuccess ? 'success' : 'danger'}>{globalMessage}</Flash>
          )}
        </Box>
      </DefaultLayout>
    </>
  );
}
