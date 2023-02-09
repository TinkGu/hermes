import '../../utils/env';
import { registerRssWorkflow, kickRssFlow } from '../../utils/rss';
import { collectRssToInbox } from '../raindrop/collect-rss';

registerRssWorkflow('raindrop RSS 自动推送', collectRssToInbox);

kickRssFlow();
