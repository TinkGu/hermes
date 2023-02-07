import { registerRssWorkflow, kickRssFlow } from '../../utils/rss';

registerRssWorkflow('star', (feeds) => {
  console.log('走到了这一步');
});

kickRssFlow();
