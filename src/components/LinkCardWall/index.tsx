import LinkCard from './LinkCard';
import LinkCardWallComp from './LinkCardWall';

interface LinkCardWallStatics {
  LinkCard: typeof LinkCard;
}

type LinkCardWallType = typeof LinkCardWallComp & LinkCardWallStatics;

const LinkCardWall = LinkCardWallComp as LinkCardWallType;
LinkCardWall.LinkCard = LinkCard;

export default LinkCardWall;
