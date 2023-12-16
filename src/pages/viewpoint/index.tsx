import React from 'react';
import { Banner } from '@/components';
import { BannerProps } from '@/components/props';
import './index.scss';

interface viewPointItem extends BannerProps {
  key: React.Key; // 用于map生成react节点
  text: React.ReactNode; // 其实就是children
}

/**
 * 观点列表
 */
const viewPointList: viewPointItem[] = [
  {
    key: 1,
    text: <>爱怎么说话是自己的事，说完别人怎么看是别人的事。</>,
    signature: 'Jan 30th, 2023',
  },
  {
    key: 2,
    text: <>“你不知道更好”是不告诉别人某件事情的最坏理由，拿出一幅懂的样子不说无异于摆架子。</>,
    signature: 'Mar 25th, 2023',
  },
  {
    key: 3,
    text: <>不确定一件事在他人的角度是好是坏而无法决定，那就从自己的角度去决定，不要把事情复杂化。</>,
    signature: 'Mar 28th, 2023',
  },
  {
    key: 4,
    text: <>类比这一修辞手法在不讲逻辑的用途上是相当不错的手段。</>,
    signature: 'Apr 7th, 2023',
  },
  {
    key: 5,
    text: <>自我放弃的人没有被拯救的条件和资格。</>,
    signature: 'Apr 16th, 2023',
  },
  {
    key: 6,
    text: <>顾虑过多的结果是寸步难行。</>,
    signature: 'Apr 17th, 2023',
  },
  {
    key: 7,
    text: <>人生不能用控制变量法，事后回想的“当初应该”未必是真应该。</>,
    signature: 'Apr 21st, 2023',
  },
  {
    key: 8,
    text: <>逆境使人愈发觉得事事不顺，愈发觉得自己身处泥沼之中。</>,
    signature: 'Apr 23rd, 2023',
  },
  {
    key: 9,
    text: <>
      “没有的事……”
      <br />
      “没有的事？狼子村现吃；还有书上都写着，通红斩新！”
      <br />
      他便变了脸，铁一般青。睁着眼说，“有许有的，这是从来如此…”
      <br />
      “从来如此，便对么？”
      <br />
      “我不同你讲这些道理；总之你不该说，你说便是你错！”
      <br />
      我直跳起来，张开眼，这人便不见了。
    </>,
    source: '鲁迅《狂人日记》',
    signature: 'Apr 29th, 2023',
  },
  {
    key: 10,
    text: <>如有必要，当增实体。</>,
    signature: 'May 10th, 2023',
  },
  {
    key: 11,
    text: <>
      有人说要改良，有人说干脆扔了但没有动静，有人准备改良了又被说不如扔掉。
      <br />
      大家各抒己见，现状一成不变。
    </>
    ,
    signature: 'Jun 13th, 2023',
  },
  {
    key: 12,
    text: <>萌娘百科的存在不是必要的；因为一个东西（编辑、内容）没有必要而否认它同样是不合理的。</>,
    signature: 'Jun 19th, 2023',
  },
  {
    key: 13,
    text: <>
      对于“改变现状”言论发表不可能观点的人，过去或将来也是使其变得不可能的人。
      <br />
      你可以对积极的事情持悲观态度，但请不要阻拦别人去做这件事
    </>,
    source: '观评有感',
    signature: 'Aug 14th, 2023',
  },
  {
    key: 14,
    text: <>Make the best use of what is in your power, and take the rest as it happens.</>,
    source: '爱比克泰德',
    signature: 'Aug 16th, 2023',
  },
  {
    key: 15,
    text: <>不要指望一个人在全局发挥大用，也不要忽略一个人对全局的作用。</>,
    signature: 'Oct 4th, 2023',
  },
  {
    key: 16,
    text: <>“不知道”不是错误，不值得一个劲地嘲笑。</>,
    signature: 'Oct 20th, 2023',
  },
  {
    key: 17,
    text: <>“……学得足够好就能……/在……方面干的足够顶尖就……”（即“厉害的人做什么都厉害”）是完全不负责任的唯心主义言论。</>,
    signature: 'Nov 27th, 2023',
  },
];

const Viewpoint: React.FC = () => {
  document.title = '个人观点 - BearBin';

  return (
    <>
      <h1>个人观点</h1>
      <Banner
        type='header'
      >
        基本上都来自于
        <a
          href='https://mzh.moegirl.org.cn/_?curid=561478'
          rel='noreferrer'
          target='_blank'
        >
          我的萌百用户页
        </a>
        ，放在这里主要是凑一页用（
      </Banner>
      {viewPointList.map(({ key, signature, text: children, source }) => (
        <Banner
          key={key}
          signature={signature}
          source={source}
        >
          {children}
        </Banner>
      ))}
    </>
  );
};

export default Viewpoint;
