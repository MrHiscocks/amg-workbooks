import unittest, tempfile, importlib.util, json
from pathlib import Path
from PIL import Image
spec=importlib.util.spec_from_file_location('catalogue',Path(__file__).parents[1]/'scripts/build_catalogue.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class CatalogueTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.old=module.ROOT;module.ROOT=Path(self.temp.name)
 def tearDown(self):module.ROOT=self.old;self.temp.cleanup()
 def image(self,relative,size=(64,64)):
  p=module.ROOT/'assets'/relative;p.parent.mkdir(parents=True,exist_ok=True);Image.new('RGBA',size,(0,120,100,255)).save(p);return p
 def test_new_folder_file_appears_without_metadata(self):
  self.image('players/woodland/sTestCreatureMove_strip4.png',(256,96));d=module.build();a=d['assets'][0];self.assertEqual(d['counts']['concepts'],1);self.assertEqual(a['primary']['frames'],4);self.assertEqual(a['primary']['frameWidth'],64);self.assertIn('woodland',a['tags']);self.assertEqual(a['category'],'players')
 def test_invalid_strip_blocks_build(self):
  self.image('players/sBroken_strip4.png',(255,96))
  with self.assertRaisesRegex(ValueError,'not divisible'):module.build()
 def test_duplicate_download_names_block_build(self):
  self.image('ground/a/sRock.png');self.image('ground/b/sRock.png')
  with self.assertRaisesRegex(ValueError,'Duplicate download'):module.build()
 def test_renamed_theme_folder_keeps_auto_id(self):
  p=self.image('ground/a/sRock.png');id1=module.build()['assets'][0]['id'];dest=p.parent.parent/'b';p.parent.rename(dest);id2=module.build()['assets'][0]['id'];self.assertEqual(id1,id2)
 def test_hash_change_blocks_silent_replacement(self):
  p=self.image('ground/sRock.png');p.with_suffix('.png.json').write_text(json.dumps({'sourceSha256':'incorrect'}))
  with self.assertRaisesRegex(ValueError,'source hash changed'):module.build()
 def test_static_asset_can_have_zero_fps(self):
  p=self.image('hazards/sStillHazard.png');p.with_suffix('.png.json').write_text(json.dumps({'fps':0}));self.assertEqual(module.build()['assets'][0]['primary']['fps'],0)
 def test_missing_external_url_blocks_build(self):
  import os
  old=os.environ.pop('ASSET_BASE_URL',None)
  try:
   with self.assertRaisesRegex(ValueError,'requires ASSET_BASE_URL'):module.build(True)
  finally:
   if old is not None:os.environ['ASSET_BASE_URL']=old
if __name__=='__main__':unittest.main()
