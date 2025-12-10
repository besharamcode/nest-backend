-- Token bucket implementation (atomic)
-- KEYS[1] = bucket key
-- ARGV[1] = now_ms
-- ARGV[2] = refill_tokens_per_ms
-- ARGV[3] = capacity
-- ARGV[4] = tokens_required
local key = KEYS[1]
local now = tonumber(ARGV[1])
local rate = tonumber(ARGV[2]) -- <<-- fix here
local capacity = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'last')
local tokens = tonumber(data[1]) or capacity
local last = tonumber(data[2]) or now

-- refill tokens
local delta = math.max(0, now - last)
local refill = delta * rate
tokens = math.min(capacity, tokens + refill)
last = now

local allowed = 0
if tokens >= cost then
    tokens = tokens - cost
    allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'last', last)
-- set TTL so unused buckets expire (ms)
redis.call('PEXPIRE', key, 60000)

return {allowed, tokens}
