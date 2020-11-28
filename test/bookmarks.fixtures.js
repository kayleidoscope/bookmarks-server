function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'YNAB',
            url: 'https://www.youneedabudget.com/',
            description: 'Great budgeting site',
            rating: 5
        },
        {
            id: 2,
            title: 'Google',
            url: 'https://www.google.com/',
            description: 'A programmers frenemy',
            rating: 4
        },
        {
            id: 3,
            title: 'Facebook',
            url: 'https://www.facebook.com/',
            description: 'Less cool every year',
            rating: 2
        }
    ];
}

module.exports = {
    makeBookmarksArray
}