import tornado.web
import tornado.database
import functools
import json

# (clue_number, answer, original_text, points, location, is_solved, photos)

# Issues: no transactions.

def valid_team(fun):
  @functools.wraps(fun)
  def wrapped(self, team, *args, **kwargs):
    import pdb; pdb.set_trace()
    if not self.db.execute_rowcount("select count(*) from teams where id = ?", team) > 0:
      raise HTTPError(403)
    fun(team, *args, **kwargs)
  return wrapped

def existing_clue(fun):
  @functools.wraps(fun)
  def wrapped(self, team, clue, *args, **kwargs):
    if not self.db.execute_rowcount("select count(*) from clues where team = ? and clue_number = ?",
                                    team, clue) > 0:
      raise HTTPError(404)
    fun(team, clue, *args, **kwargs)
  return wrapped

class BaseHandler(tornado.web.RequestHandler):
  def __init__(self, *args, **kwargs):
    super(BaseHandler, self).__init__(*args, **kwargs)
    self.db = tornado.database.Connection("localhost", "HuskyHunterBase", user="root")
    
class CluesHandler(BaseHandler):
  @valid_team
  def get(self, team):
    self.write(json.dumps([json.loads(row.body) for row in
                           self.db.iter("select * from clues where team = ?", team)]))
    db.close()

class PhotosHandler(BaseHandler):
  @valid_team
  @existing_clue
  def get(self, team, clue):
    self.write(json.dumps([json.loads(row.body)["photos"] for row in
                           self.db.iter("select * from clues where team = ? and clue_number = ?", team, clue)]))
    db.close()

class TeamsHandler(BaseHandler):
  def get(self):
    self.write("woot")

application = tornado.web.Application([
    (r"/teams/", TeamsHandler),
    (r"/teams/([^/]+)/clues/", CluesHandler),
    (r"/teams/([^/]+)/clues/([^/]+)/photos/", PhotosHandler),
])
