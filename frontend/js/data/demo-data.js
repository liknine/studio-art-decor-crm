let stages=[
  {name:'Новый заказ',color:'#b8bbc0',events:[
    {title:'Новая заявка с сайта',subtitle:'ещё не обработана',avatar:'Н',date:'28 августа 2026',time:'—',contact:'Анна · +375 29 000-00-00',place:'Falcon Club',comment:'Клиент просит связаться после 18:00. Пока не присылать финальные варианты без звонка.',reminders:0,estimate:false,source:'site',received:'сегодня · 10:42',newLead:true,priority:'urgent'},
    {title:'Корпоратив NOVA',subtitle:'заявка с сайта',avatar:'N',date:'3 сентября 2026',time:'19:00',contact:'Ирина · +375 44 000-00-00',place:'Robinson Club',comment:'Финальное решение принимает Ирина. Все согласования отправлять одним сообщением.',reminders:0,estimate:false,source:'site',received:'сегодня · 10:18',newLead:true,priority:'high'}
  ]},
  {name:'Переговоры',color:'#4385dd',events:[
    {title:'Свадьба Анны и Максима',subtitle:'Falcon Club',avatar:'А',date:'24 августа 2026',time:'14:00',contact:'Анна · +375 29 000-00-00',place:'Falcon Club',comment:'Невеста очень переживает из-за оттенков. Все цветовые решения подтверждать перед финальным согласованием.',reminders:3,estimate:true,priority:'high'},
    {title:'День рождения Софии',subtitle:'Prime Hall',avatar:'С',date:'31 августа 2026',time:'17:30',contact:'Елена · +375 33 000-00-00',place:'Prime Hall',comment:'Мама именинницы отвечает за тайминг. В день монтажа писать только ей.',reminders:1,estimate:true},
    {title:'Свадьба Марии и Ильи',subtitle:'Villa Riviera',avatar:'М',date:'6 сентября 2026',time:'15:00',contact:'Мария · +375 25 000-00-00',place:'Villa Riviera',comment:'Клиенты часто меняют решения. После каждой встречи фиксировать итог письменно.',reminders:2,estimate:false}
  ]},
  {name:'Составляем ТЗ',color:'#7765d8',events:[
    {title:'Презентация коллекции',subtitle:'City Hall',avatar:'П',date:'27 августа 2026',time:'18:00',contact:'Юлия · +375 29 000-00-00',place:'City Hall',comment:'У заказчика строгий брендбук. Любые визуальные изменения сначала отправлять на согласование.',reminders:1,estimate:true},
    {title:'Wedding Dinner',subtitle:'Marriott',avatar:'W',date:'5 сентября 2026',time:'18:30',contact:'Кристина · +375 44 111-11-11',place:'Marriott',comment:'Контакт со стороны площадки отвечает медленно. Вопросы по доступу решать заранее.',reminders:2,estimate:true}
  ]},
  {name:'Подготовительные работы',color:'#ef9847',events:[
    {title:'Выездная регистрация',subtitle:'Усадьба «Сосны»',avatar:'В',date:'29 августа 2026',time:'11:00',contact:'Мария · +375 29 000-00-00',place:'Усадьба «Сосны»',comment:'Заезд на площадку только через служебный въезд. Пропуск оформить за день.',reminders:2,estimate:true},
    {title:'Beauty Brand Launch',subtitle:'Loft 8',avatar:'B',date:'2 сентября 2026',time:'16:00',contact:'Алина · +375 29 222-22-22',place:'Loft 8',comment:'На площадке ограничено время на разгрузку — максимум 30 минут.',reminders:1,estimate:true}
  ]},
  {name:'Монтаж',color:'#28a66f',events:[
    {title:'Летний корпоратив',subtitle:'Green Park',avatar:'Л',date:'22 августа 2026',time:'10:00',contact:'Ольга · +375 29 333-33-33',place:'Green Park',comment:'Координатор на площадке — Ольга. Все спорные моменты решать через неё.',reminders:1,estimate:true}
  ]},
  {name:'Демонтаж',color:'#4aa5b5',events:[
    {title:'Private Dinner',subtitle:'Astoria Riverside',avatar:'P',date:'21 августа 2026',time:'23:30',contact:'Дарья · +375 29 444-44-44',place:'Astoria Riverside',comment:'Демонтаж можно начинать только после сигнала администратора площадки.',reminders:1,estimate:true}
  ]},
  {name:'Закрыт',color:'#76a071',events:[
    {title:'Свадьба Екатерины и Павла',subtitle:'Riviera Country Club',avatar:'Е',date:'16 августа 2026',time:'15:00',contact:'Екатерина · +375 29 555-55-55',place:'Riviera Country Club',comment:'Клиент попросил сохранить контакты подрядчиков для будущих мероприятий.',reminders:0,estimate:true}
  ]}
];

const rentalProducts=[
  {name:'Белая деревянная арка',category:'Конструкции',price:60,total:1,busy:0,desc:'Высота 2,5 м, ширина 2 м. Для церемоний и фотозон.'},
  {name:'Белые металлические стойки',category:'Конструкции',price:30,total:8,busy:4,desc:'Стойки для декора, выбор высот, основание 30×30 см.'},
  {name:'Чёрная телескопическая конструкция',category:'Конструкции',price:50,total:3,busy:1,desc:'Регулируемая высота 2–2,8 м.'},
  {name:'Круглая конструкция 2,5 м',category:'Конструкции',price:150,total:1,busy:0,desc:'Полностью разборная круглая конструкция.'},
  {name:'Белый мольберт 170 см',category:'Реквизит',price:30,total:1,busy:0,desc:'Для приветственных табличек, планов рассадки и декора.'},
  {name:'Комплект мини-ваз',category:'Реквизит',price:25,total:1,busy:0,desc:'Набор прозрачных ваз разной формы.'},
  {name:'Стеклянная ваза 29 см',category:'Реквизит',price:3,total:20,busy:8,desc:'Прозрачная стеклянная ваза.'},
  {name:'Ваза-цилиндр 26 см',category:'Реквизит',price:4,total:15,busy:5,desc:'Прозрачная стеклянная ваза-цилиндр.'},
  {name:'Декоративное сердце 80×80',category:'Реквизит',price:25,total:1,busy:0,desc:'Фанера, поролон и бархат.'},
  {name:'Неоновая надпись 50×80',category:'Реквизит',price:70,total:1,busy:1,desc:'«Просто такая сильная любовь».'},
  {name:'Фотозона с сердцами 2,5×3 м',category:'Фотозоны',price:350,total:1,busy:0,desc:'Металлическая конструкция, ткань-вуаль и два сердца.'},
  {name:'Розовая фотозона из фатина',category:'Фотозоны',price:250,total:1,busy:0,desc:'Размер 2,5×3 м, конструкция и фатиновое полотно.'}
];

const DEFAULT_ESTIMATE=[
  {name:'Белая деревянная арка',sub:'Конструкции',qty:1,client:60,cost:20,clientVisible:true},
  {name:'Белые металлические стойки',sub:'Конструкции',qty:4,client:120,cost:40,clientVisible:true},
  {name:'Стеклянная ваза 29 см',sub:'Реквизит',qty:12,client:36,cost:12,clientVisible:true},
  {name:'Комплект мини-ваз',sub:'Реквизит',qty:1,client:25,cost:10,clientVisible:true},
  {name:'Декоративное сердце 80×80',sub:'Реквизит',qty:1,client:25,cost:8,clientVisible:true},
  {name:'Деревянные декоративные фонари',sub:'Реквизит',qty:4,client:40,cost:16,clientVisible:true},
  {name:'Неоновая надпись',sub:'Реквизит',qty:1,client:70,cost:20,clientVisible:true},
  {name:'Доставка',sub:'Доп. расход',qty:1,client:90,cost:55,clientVisible:true},
  {name:'Монтаж',sub:'Доп. расход',qty:1,client:80,cost:42,clientVisible:true}
];
