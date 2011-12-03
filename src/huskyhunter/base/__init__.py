import tornado.web
import tornado.database
import functools
import json
import uuid

# (clue_number, answer, original_text, points, location, is_solved, photos)

# Issues: no transactions.

def decode_clue(clue_bytes):
  return json.loads(clue_bytes)

def generate_id():
  base_id = uuid.uuid4()
  return base_id.int % 100000000

def valid_team(fun):
  @functools.wraps(fun)
  def wrapped(self, team, *args, **kwargs):
    if not self.db.execute_rowcount("select * from teams where id = %s", team) > 0:
      raise tornado.web.HTTPError(403)
    fun(self, team, *args, **kwargs)
  return wrapped

def existing_clue(fun):
  @functools.wraps(fun)
  def wrapped(self, team, clue, *args, **kwargs):
    if not self.db.execute_rowcount("select * from clues where team = %s and clue_number = %s",
                                    team, clue) > 0:
      raise tornado.web.HTTPError(404)
    fun(team, clue, *args, **kwargs)
  return wrapped

class BaseHandler(tornado.web.RequestHandler):
  def __init__(self, *args, **kwargs):
    super(BaseHandler, self).__init__(*args, **kwargs)
    self.db = tornado.database.Connection("localhost", "HuskyHunterBase", user="root")
    
class CluesHandler(BaseHandler):
  @valid_team
  def get(self, team):
    self.write(json.dumps([decode_clue(row.body) for row in
                           self.db.iter("select * from clues where team = %s", team)]))
    self.db.close()

  @valid_team
  def post(self, team):
    clues = json.loads(self.request.body)
    args = reduce(lambda x, y: x + y, ([team, clue["clue_number"], json.dumps(clue)] for clue in clues))
                             
    self.db.execute("insert into clues (team, clue_number, body) values " +
                    " ".join("(%s, %s, %s)" for clue in clues), *args)
    self.db.close()

class PhotosHandler(BaseHandler):
  @valid_team
  @existing_clue
  def get(self, team, clue):
    self.write(json.dumps([decode_clue(row.body)["photos"] for row in
                           self.db.iter("select * from clues where team = %s and clue_number = %s", team, clue)]))
    self.db.close()

class TeamsHandler(BaseHandler):
  def post(self):
    name = self.get_argument("name")
    new_id = generate_id()
    self.db.execute("insert into teams (id, name) values (%s, %s)", new_id, name)
    self.write(json.dumps({"name": name, "id": new_id}))
    self.db.close()

application = tornado.web.Application([
    (r"/teams/", TeamsHandler),
    (r"/teams/([^/]+)/clues/", CluesHandler),
    (r"/teams/([^/]+)/clues/([^/]+)/photos/", PhotosHandler),
])
