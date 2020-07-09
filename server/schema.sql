DROP TABLE IF EXISTS Audits;

CREATE TABLE Audits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session     TEXT NOT NULL,
    method      TEXT NOT NULL,
    features    TEXT,  -- comma-separated list of features.
                       -- ugly, but hey it's hackish anyways
    start       INTEGER NOT NULL,
    elapsed     INTEGER,
    success     INTEGER -- secretly a boolean but sqlite does not support bools
);

