import TabsComp from './Tabs';
import Tab from './Tab';

interface TabsStatics {
  Tab: typeof Tab;
}

type TabsType = typeof TabsComp & TabsStatics;

const Tabs = TabsComp as TabsType;
Tabs.Tab = Tab;

export default Tabs;
