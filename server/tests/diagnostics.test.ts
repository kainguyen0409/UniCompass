import assert from 'node:assert/strict';
import test from 'node:test';
import { verificationError } from '../src/assistant/diagnostics.js';
test('verification reports actionable provider errors without credentials or headers', () => {
 const result = verificationError({status:400,error:{message:'Unsupported parameter reasoning; secret-value gsk_example123 Bearer token',type:'invalid_request_error',param:'reasoning'},headers:{authorization:'secret-value'}},'secret-value');
 assert.equal(result.status,400);
 assert.equal(result.param,'reasoning');
 assert.match(result.message,/Unsupported parameter/);
 assert.ok(!JSON.stringify(result).includes('secret-value'));
 assert.ok(!JSON.stringify(result).includes('gsk_example123'));
 assert.ok(!JSON.stringify(result).includes('Bearer token'));
 assert.ok(!('headers' in result));
});
