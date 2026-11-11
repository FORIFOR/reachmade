-- Inquiries sent from the reachmade.com form. Kept 90 days, then removed by the daily cleanup.
CREATE TABLE inquiries (
  request_id   TEXT PRIMARY KEY,           -- the form's retry UUID; a retry with the same ID is the same inquiry
  receipt      TEXT NOT NULL UNIQUE,       -- shown to the visitor, e.g. RM-1A2B3C4D
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  use_case     TEXT NOT NULL,
  message      TEXT NOT NULL,
  language     TEXT NOT NULL CHECK (language IN ('ja','en')),
  fingerprint  TEXT NOT NULL,              -- hash of the content, to tell a retry from a changed resubmission
  created_at   INTEGER NOT NULL,           -- ms since epoch
  expires_at   INTEGER NOT NULL,
  notice       TEXT NOT NULL DEFAULT 'none' CHECK (notice IN ('none','sent','failed')),
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','replied'))
);
CREATE INDEX inquiries_expires ON inquiries (expires_at);
CREATE INDEX inquiries_created ON inquiries (created_at);

-- Replies the operator sent from the reply page. `nonce` comes from the page, so a double submit is one reply.
CREATE TABLE inquiry_replies (
  request_id TEXT NOT NULL REFERENCES inquiries (request_id) ON DELETE CASCADE,
  nonce      TEXT NOT NULL,
  text       TEXT NOT NULL,
  at         INTEGER NOT NULL,
  PRIMARY KEY (request_id, nonce)
);

-- Daily intake limits: k = '*' for all inquiries, or a SHA-256 of the lower-cased email.
CREATE TABLE inquiry_usage (
  day TEXT NOT NULL,
  k   TEXT NOT NULL,
  n   INTEGER NOT NULL,
  PRIMARY KEY (day, k)
);
