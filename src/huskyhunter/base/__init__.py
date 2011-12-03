import tornado.web
import tornado.database
import json

# (clue_number, answer, original_text, points, location, is_solved, photos)

class BaseHandler(tornado.web.RequestHandler):
  def __init__(self):
    self.db = tornado.database.Connection("localhost", "HuskyHunterBase")
    
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
                           self.db.iter("select * from clues where team = ? and clue = ?", team, clue)]))
    db.close()

application = tornado.web.Application([
    (r"/team/([^/]+)/clues/", CluesHandler),
    (r"/team/([^/]+)/clues/([^/]+)/photos/", PhotosHandler),
])
