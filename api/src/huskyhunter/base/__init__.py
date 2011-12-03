import tornado.web
import tornado.database
import functools
import json
import uuid

# (clue_number, answer, original_text, points, location, is_solved, photos)

# Issues: no transactions. db.close() should be in some sort of deconstructor

def jsonp(name, body):
  return "%s(%s)" % (name, body)

def decode_clue(clue_bytes):
  return json.loads(clue_bytes)

def encode_clue(clue):
  return json.dumps(clue)

def generate_id():
  base_id = uuid.uuid4()
  return base_id.int % 100000000

def valid_team(fun):
  @functools.wraps(fun)
  def wrapped(self, team, *args, **kwargs):
    if not self.db.execute_rowcount("select * from teams where id = %s", team) > 0:
      raise tornado.web.HTTPError(404)
    fun(self, team, *args, **kwargs)
  return wrapped

def existing_clue(fun):
  @functools.wraps(fun)
  def wrapped(self, team, clue, *args, **kwargs):
    if not self.db.execute_rowcount("select * from clues where team = %s and clue_number = %s",
                                    team, clue) > 0:
      raise tornado.web.HTTPError(404)
    fun(self, team, clue, *args, **kwargs)
  return wrapped

class BaseHandler(tornado.web.RequestHandler):
  def __init__(self, *args, **kwargs):
    super(BaseHandler, self).__init__(*args, **kwargs)
    self.jsonp_callback = self.get_argument("callback", "")
    self.has_jsonp_callback = self.jsonp_callback != ""
    self.db = tornado.database.Connection("localhost", "HuskyHunterBase", user="root")

  def writeJsonp(self, body):
    self.write(jsonp(self.jsonp_callback, body) if self.has_jsonp_callback else body)

class CluesHandler(BaseHandler):
  @valid_team
  def get(self, team):
    self.writeJsonp(json.dumps([decode_clue(row.body) for row in
                           self.db.iter("select * from clues where team = %s", team)]))
    self.db.close()

  @valid_team
  def post(self, team):
    clues = json.loads(self.request.body)
    args = reduce(lambda x, y: x + y, ([team, clue["clue_number"], encode_clue(clue)] for clue in clues))
    self.db.execute("insert into clues (team, clue_number, body) values " +
                    ", ".join("(%s, %s, %s)" for clue in clues), *args)
    self.db.close()

class ClueHandler(BaseHandler):
  @valid_team
  @existing_clue
  def get(self, team, clue_number):
    self.writeJsonp(decode_clue(self.db.get("select * from clues where team = %s and clue_number = %s ",
                                       team, clue_number).body))
    self.db.close()

  @valid_team
  @existing_clue
  def put(self, team, clue_number):
    if self.request.headers.get("Expect", "") == "100-continue":
      self.set_header("Accept", "text/plain, application/json")
      self.set_status(100)
      return
    clue = json.loads(self.request.body)
    self.db.execute("update clues set body = %s where team = %s and clue_number = %s",
                    encode_clue(clue), team, clue_number)
    self.db.close()
    self.writeJsonp(self.request.body)

  @valid_team
  @existing_clue
  def delete(self, team, clue_number):
    self.db.execute("delete from clues where team = %s and clue_number = %s", team, clue_number)
    self.db.close()

class PhotosHandler(BaseHandler):
  @valid_team
  @existing_clue
  def get(self, team, clue):
    self.writeJsonp(json.dumps([decode_clue(row.body)["photos"] for row in
                           self.db.iter("select * from clues where team = %s and clue_number = %s", team, clue)]))
    self.db.close()    

class TeamsHandler(BaseHandler):
  def post(self):
    name = self.get_argument("name")
    new_id = generate_id()
    self.db.execute("insert into teams (id, name) values (%s, %s)", new_id, name)
    self.writeJsonp(json.dumps({"name": name, "id": new_id}))
    self.db.close()

application = tornado.web.Application([
    (r"/teams/", TeamsHandler),
    (r"/teams/([^/]+)/clues/", CluesHandler),
    (r"/teams/([^/]+)/clues/([^/]+)/", ClueHandler),
    (r"/teams/([^/]+)/clues/([^/]+)/photos/", PhotosHandler),
])
