export function authErrorMessage(error:unknown):string{
 const e=error as {code?:string;message?:string};
 if(e?.code==='over_email_send_rate_limit'||/email rate limit exceeded/i.test(e?.message??''))return 'Email sending is temporarily rate-limited. Existing verified accounts can still use Sign in. New confirmation and reset emails must wait until sending is available again.';
 if(e?.code==='email_address_not_authorized'||/email address not authorized/i.test(e?.message??''))return 'Signup emails are not available for this address yet. The organizer needs to finish email delivery setup.';
 if(e?.code==='email_not_confirmed')return 'Confirm your email before signing in. If you already opened the confirmation link, try Sign in again.';
 if(e?.code==='invalid_credentials')return 'Email or password is incorrect. If you have not created an account, choose Sign up first.';
 return e?.message??'Something went wrong. Please try again.';
}
