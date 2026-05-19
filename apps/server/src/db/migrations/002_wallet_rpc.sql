-- ─── Atomic entry fee deduction ──────────────────────────────────────────────
-- Deducts `amount` from each player in `player_ids` inside a single transaction.
-- Raises an exception if any player has insufficient balance — entire operation rolls back.

CREATE OR REPLACE FUNCTION deduct_entry_fees(
  player_ids UUID[],
  amount     BIGINT,
  p_match_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  pid             UUID;
  current_balance BIGINT;
  wallet_id_val   UUID;
BEGIN
  FOREACH pid IN ARRAY player_ids LOOP
    -- Lock the wallet row to prevent concurrent deductions
    SELECT id, balance
      INTO wallet_id_val, current_balance
      FROM wallets
     WHERE user_id = pid
       FOR UPDATE;

    IF current_balance < amount THEN
      RAISE EXCEPTION 'Insufficient balance for user %', pid
        USING ERRCODE = 'P0001';
    END IF;

    UPDATE wallets
       SET balance = balance - amount,
           updated_at = now()
     WHERE id = wallet_id_val;

    INSERT INTO transactions (wallet_id, amount, type, match_id)
    VALUES (wallet_id_val, -amount, 'entry_fee', p_match_id);
  END LOOP;
END;
$$;

-- ─── Payout winner ────────────────────────────────────────────────────────────
-- Awards `payout_amount` to `winner_id` and records the transaction.

CREATE OR REPLACE FUNCTION payout_winner(
  winner_id     UUID,
  payout_amount BIGINT,
  p_match_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  wallet_id_val UUID;
BEGIN
  SELECT id INTO wallet_id_val
    FROM wallets
   WHERE user_id = winner_id
     FOR UPDATE;

  UPDATE wallets
     SET balance = balance + payout_amount,
         updated_at = now()
   WHERE id = wallet_id_val;

  INSERT INTO transactions (wallet_id, amount, type, match_id)
  VALUES (wallet_id_val, payout_amount, 'payout', p_match_id);
END;
$$;
