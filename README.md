# Como testar

1. Se certificar de ter o docker e o node.js instalado na máquina;
2. Abra a pasta websocket no terminal e execute o comando docker-compose up -d --build;
3. Após isso, abra a pasta front no terminal e execute o comando npm run dev.

Se todos os passos foram cumpridos corretamente, abra o seu navegador e acesse http://localhost:5173  

## Informações sobre as features

1. Para se conectar, basta inserir o nome desejado. Esse é tratado como chave primária, porém não é imposto nenhuma regra, então tome cuidado quando acessar o mesmo nome por duas conexões;
2. Para mandar uma mensagem global, basta digitar algo no input e apertar enter ou no botão 'enviar';
3. Caso queira ver os usuários conectados, basta apertar a tecla 'Tab';
4. Caso queira mandar uma mensagem privada a algum usuário, basta clicar no nome dele. Caso queira sair dessa opção, haverá um botão à direita ou poderá clicar no nome do usuário novamente.
5. O seu histórico de conversas e notificações é salvo em cache no redis. Caso queira acessar, utilize o comando docker exec -it redis redis-cli.
   Para acessar o histórico de mensagens globais, rode o comando GET global_messages;
   No caso das mensagens privadas, o comando é GET private_messages;
   Para sair da interface, basta digitar exit no terminal.
