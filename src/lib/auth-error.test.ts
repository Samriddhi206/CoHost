import {expect,it} from 'vitest';
import {authErrorMessage} from './auth-error';
it('separates email sending limits from existing-account sign-in',()=>{expect(authErrorMessage({code:'over_email_send_rate_limit'})).toContain('Existing verified accounts can still use Sign in');expect(authErrorMessage({message:'email rate limit exceeded'})).toContain('temporarily rate-limited')});
it('explains sender authorization and unconfirmed accounts',()=>{expect(authErrorMessage({code:'email_address_not_authorized'})).toContain('email delivery setup');expect(authErrorMessage({code:'email_not_confirmed'})).toContain('Confirm your email')});
