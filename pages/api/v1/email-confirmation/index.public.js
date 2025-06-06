import { createRouter } from 'next-connect';

import authentication from 'models/authentication.js';
import authorization from 'models/authorization.js';
import cacheControl from 'models/cache-control';
import controller from 'models/controller.js';
import emailConfirmation from 'models/email-confirmation.js';
import validator from 'models/validator.js';

export default createRouter()
  .use(controller.injectRequestMetadata)
  .use(authentication.injectAnonymousOrUser)
  .use(controller.logRequest)
  .use(cacheControl.noCache)
  .patch(patchValidationHandler, patchHandler)
  .handler(controller.handlerOptions);

function patchValidationHandler(request, response, next) {
  const cleanValues = validator(request.body, {
    token_id: 'required',
  });

  request.body = cleanValues;

  return next();
}

async function patchHandler(request, response) {
  const userTryingToChangeEmail = request.context.user;
  const validatedInputValues = request.body;

  const tokenObject = await emailConfirmation.confirmEmailUpdate(validatedInputValues.token_id);

  const authorizedValuesToReturn = authorization.filterOutput(
    userTryingToChangeEmail,
    'read:email_confirmation_token',
    tokenObject,
  );

  return response.status(200).json(authorizedValuesToReturn);
}
