import json

def encode(clue):
  return json.dumps(clue)

def decode(clue_json):
  # TODO: field validation.
  clue = json.loads(clue_json)
  clue["id"] = clue["number"]
  return clue

def get(db, team, clue_number):
  maybe_json = get_json(db, team, clue_number)
  return (decode(maybe_json) if not maybe_json is None else maybe_json)

def get_json(db, team, clue_number):
  maybe_row = db.get("select * from clues where team = %s and clue_number = %s ", team, clue_number)
  return (maybe_row.body if not maybe_row is None else maybe_row)

def get_all(db, team):
  return [decode(row.body) for row in db.iter("select * from clues where team = %s", team)]

def create(db, team, clue_number, clue):
  db.execute("insert into clues (team, clue_number, body) values (%s, %s, %s)", team, clue_number, encode(clue))

def update(db, team, clue_number, clue):
  current_clue = get(db, team, clue_number)
  for field in clue.keys():
    current_clue[field] = clue[field]
  db.execute("update clues set body = %s where team = %s and clue_number = %s", encode(current_clue), team, clue_number)
  return current_clue

def delete(db, team, clue_number):
  db.execute("delete from clues where team = %s and clue_number = %s", team, clue_number)
